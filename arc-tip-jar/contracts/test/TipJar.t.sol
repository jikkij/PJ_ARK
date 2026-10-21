// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test}       from "forge-std/Test.sol";
import {TipJar}     from "../TipJar.sol";
import {MockERC20}  from "../test-helpers/MockERC20.sol";

contract TipJarTest is Test {
    // ── Actors ────────────────────────────────────────────────────────────────
    address internal recipient = makeAddr("recipient");
    address internal alice     = makeAddr("alice");
    address internal bob       = makeAddr("bob");

    // ── Contracts ─────────────────────────────────────────────────────────────
    MockERC20 internal token;
    TipJar    internal jar;

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 internal constant MINT_AMOUNT = 1_000_000e6; // 1 M tokens (6 dp)
    string  internal constant MSG_OK      = "great work!";

    // ── setUp runs before EVERY test ──────────────────────────────────────────
    function setUp() public {
        token = new MockERC20("Mock USD", "mUSD", 6);
        jar   = new TipJar(address(token), recipient);

        // Fund alice and bob with tokens; both approve the jar for max
        token.mint(alice, MINT_AMOUNT);
        token.mint(bob,   MINT_AMOUNT);
        vm.prank(alice);
        token.approve(address(jar), type(uint256).max);
        vm.prank(bob);
        token.approve(address(jar), type(uint256).max);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. Constructor — deployment & initialization
    // ══════════════════════════════════════════════════════════════════════════

    function test_Constructor_SetsTokenAndRecipient() public view {
        assertEq(jar.token(),     address(token), "token mismatch");
        assertEq(jar.recipient(), recipient,       "recipient mismatch");
    }

    function test_Constructor_RevertsOnZeroToken() public {
        vm.expectRevert(TipJar.ZeroAddress.selector);
        new TipJar(address(0), recipient);
    }

    function test_Constructor_RevertsOnZeroRecipient() public {
        vm.expectRevert(TipJar.ZeroAddress.selector);
        new TipJar(address(token), address(0));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. tip() — happy path (Case 1)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Tip_HappyPath() public {
        uint256 amount = 100e6;

        // ① expect the Tipped event
        vm.expectEmit(true, false, false, true, address(jar));
        emit TipJar.Tipped(alice, amount, MSG_OK);

        vm.prank(alice);
        jar.tip(amount, MSG_OK);

        // ② totalTipped
        assertEq(jar.totalTipped(), amount, "totalTipped wrong");

        // ③ tipCount
        assertEq(jar.tipCount(), 1, "tipCount wrong");

        // ④ getRecentTips[0] — newest first so index 0 is the only tip
        TipJar.Tip[] memory tips = jar.getRecentTips(10);
        assertEq(tips.length,       1,             "tips length wrong");
        assertEq(tips[0].from,      alice,         "tip.from wrong");
        assertEq(tips[0].amount,    uint96(amount),"tip.amount wrong");
        assertEq(tips[0].message,   MSG_OK,        "tip.message wrong");
        // timestamp must be in the ballpark of block.timestamp (set by forge to 1)
        assertGt(tips[0].timestamp, 0,             "tip.timestamp zero");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. tip() — ZeroAmount revert (Case 2)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Tip_RevertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(TipJar.ZeroAmount.selector);
        jar.tip(0, "hi");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. tip() — MessageTooLong revert (Case 3)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Tip_RevertsOnMessageTooLong() public {
        // Build a 281-character string (strictly > 280 byte limit)
        bytes memory raw = new bytes(281);
        for (uint256 i = 0; i < 281; i++) raw[i] = "A";
        string memory longMsg = string(raw);

        vm.prank(alice);
        vm.expectRevert(TipJar.MessageTooLong.selector);
        jar.tip(1e6, longMsg);
    }

    function test_Tip_Accepts280CharMessage() public {
        // Boundary: exactly 280 bytes should NOT revert
        bytes memory raw = new bytes(280);
        for (uint256 i = 0; i < 280; i++) raw[i] = "B";
        string memory borderMsg = string(raw);

        vm.prank(alice);
        jar.tip(1e6, borderMsg); // must not revert
        assertEq(jar.tipCount(), 1, "280-char tip not recorded");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. tip() — Insufficient allowance revert (Case 4)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Tip_RevertsOnInsufficientAllowance() public {
        address charlie = makeAddr("charlie");
        token.mint(charlie, MINT_AMOUNT);
        // charlie has tokens but has NOT approved the jar

        vm.prank(charlie);
        // safeTransferFrom will fail — MockERC20 reverts with a reason string
        vm.expectRevert(bytes("ERC20: insufficient allowance"));
        jar.tip(1e6, "no allowance");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. tip() — AmountTooLarge revert (Case 9)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Tip_RevertsOnAmountTooLarge() public {
        uint256 overMax = uint256(type(uint96).max) + 1;

        // Mint enough to cover the huge amount so allowance isn't the limiting factor
        token.mint(alice, overMax);
        vm.prank(alice);
        // Allowance already set to max uint256 in setUp — no need to re-approve

        vm.expectRevert(TipJar.AmountTooLarge.selector);
        jar.tip(overMax, "too large");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 7. withdraw() — happy path by recipient (Case 5)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Withdraw_HappyPath() public {
        uint256 amount = 500e6;

        vm.prank(alice);
        jar.tip(amount, MSG_OK);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // ① expect the Withdrawn event
        vm.expectEmit(false, false, false, true, address(jar));
        emit TipJar.Withdrawn(amount);

        vm.prank(recipient);
        jar.withdraw();

        // ② full balance transferred to recipient
        uint256 recipientBalanceAfter = token.balanceOf(recipient);
        assertEq(recipientBalanceAfter - recipientBalanceBefore, amount, "recipient balance wrong");

        // ③ jar now holds zero
        assertEq(token.balanceOf(address(jar)), 0, "jar should be empty");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 8. withdraw() — NotRecipient revert (Case 6)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Withdraw_RevertsForNonRecipient() public {
        // Put some balance in the jar first
        vm.prank(alice);
        jar.tip(100e6, MSG_OK);

        vm.prank(alice); // alice is NOT the recipient
        vm.expectRevert(TipJar.NotRecipient.selector);
        jar.withdraw();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 9. withdraw() — ZeroBalance revert (Case 7)
    // ══════════════════════════════════════════════════════════════════════════

    function test_Withdraw_RevertsOnZeroBalance() public {
        // No tips — jar is empty
        vm.prank(recipient);
        vm.expectRevert(TipJar.ZeroBalance.selector);
        jar.withdraw();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 10. getRecentTips — ordering and limit (Case 8)
    // ══════════════════════════════════════════════════════════════════════════

    function test_GetRecentTips_OrderingAndLimit() public {
        // Make 5 tips from alice, each with a distinct message so we can
        // verify newest-first ordering without relying on block.timestamp changes.
        // We warp time between tips so timestamps also differ.
        uint256 tipAmount = 10e6;
        uint256 baseTime  = block.timestamp;

        vm.prank(alice);
        vm.warp(baseTime + 1);
        jar.tip(tipAmount, "tip-1");

        vm.prank(alice);
        vm.warp(baseTime + 2);
        jar.tip(tipAmount, "tip-2");

        vm.prank(alice);
        vm.warp(baseTime + 3);
        jar.tip(tipAmount, "tip-3");

        vm.prank(alice);
        vm.warp(baseTime + 4);
        jar.tip(tipAmount, "tip-4");

        vm.prank(alice);
        vm.warp(baseTime + 5);
        jar.tip(tipAmount, "tip-5");

        assertEq(jar.tipCount(), 5, "expected 5 tips");

        // Ask for the 3 most recent
        TipJar.Tip[] memory recent = jar.getRecentTips(3);

        // ① exactly 3 returned
        assertEq(recent.length, 3, "expected exactly 3 tips back");

        // ② newest first: tip-5, tip-4, tip-3
        assertEq(recent[0].message, "tip-5", "index 0 should be tip-5");
        assertEq(recent[1].message, "tip-4", "index 1 should be tip-4");
        assertEq(recent[2].message, "tip-3", "index 2 should be tip-3");

        // ③ timestamps strictly decrease (newest → oldest)
        assertGt(recent[0].timestamp, recent[1].timestamp, "timestamp ordering [0]>[1]");
        assertGt(recent[1].timestamp, recent[2].timestamp, "timestamp ordering [1]>[2]");
    }

    function test_GetRecentTips_LimitCapAt50() public {
        // Verify that requesting more than 50 is silently capped to 50,
        // and that we get all tips when total < 50.
        uint256 tipAmount = 1e6;
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            jar.tip(tipAmount, "fill");
        }

        TipJar.Tip[] memory recent = jar.getRecentTips(100); // ask for 100, only 5 exist
        assertEq(recent.length, 5, "should be capped by actual tip count");
    }

    function test_GetRecentTips_EmptyReturnsEmpty() public view {
        TipJar.Tip[] memory recent = jar.getRecentTips(10);
        assertEq(recent.length, 0, "no tips yet");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 11. Fuzz — tip amount and message length stay within valid ranges
    // ══════════════════════════════════════════════════════════════════════════

    function testFuzz_Tip_ValidAmountAndMessage(uint96 amount, uint8 msgLen) public {
        // bound: amount in [1, type(uint96).max], msgLen in [0, 280]
        amount = uint96(bound(uint256(amount), 1, type(uint96).max));
        msgLen = uint8(bound(uint256(msgLen), 0, 280));

        // Build a message of exactly msgLen bytes
        bytes memory raw = new bytes(msgLen);
        for (uint256 i = 0; i < msgLen; i++) raw[i] = "x";

        // Make sure alice has enough balance
        token.mint(alice, uint256(amount));

        uint256 totalBefore = jar.totalTipped();

        vm.prank(alice);
        jar.tip(uint256(amount), string(raw));

        assertEq(jar.totalTipped(), totalBefore + uint256(amount), "totalTipped after fuzz tip");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 12. totalTipped accumulates across multiple tippers
    // ══════════════════════════════════════════════════════════════════════════

    function test_TotalTipped_AccumulatesAcrossMultipleTippers() public {
        uint256 amountA = 200e6;
        uint256 amountB = 300e6;

        vm.prank(alice);
        jar.tip(amountA, "from alice");

        vm.prank(bob);
        jar.tip(amountB, "from bob");

        assertEq(jar.totalTipped(), amountA + amountB, "totalTipped accumulation");
        assertEq(jar.tipCount(),    2,                 "tipCount after 2 tips");
    }
}

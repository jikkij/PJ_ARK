// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TipJar is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error ZeroAmount();
    error MessageTooLong();
    error AmountTooLarge();
    error NotRecipient();
    error ZeroBalance();

    event Tipped(address indexed from, uint256 amount, string message);
    event Withdrawn(uint256 amount);

    address public immutable token;
    address public immutable recipient;
    uint256 public totalTipped;

    struct Tip {
        address from;
        uint96 amount;
        uint40 timestamp;
        string message;
    }

    Tip[] private _tips;

    constructor(address token_, address recipient_) {
        if (token_ == address(0) || recipient_ == address(0)) revert ZeroAddress();

        token = token_;
        recipient = recipient_;
    }

    function tip(uint256 amount, string calldata message) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (bytes(message).length > 280) revert MessageTooLong();
        if (amount > type(uint96).max) revert AmountTooLarge();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        _tips.push(
            Tip({
                from: msg.sender,
                amount: uint96(amount),
                timestamp: uint40(block.timestamp),
                message: message
            })
        );

        totalTipped += amount;

        emit Tipped(msg.sender, amount, message);
    }

    function withdraw() external nonReentrant {
        if (msg.sender != recipient) revert NotRecipient();

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert ZeroBalance();

        IERC20(token).safeTransfer(recipient, balance);

        emit Withdrawn(balance);
    }

    function tipCount() external view returns (uint256) {
        return _tips.length;
    }

    function getRecentTips(uint256 limit) external view returns (Tip[] memory) {
        if (limit > 50) {
            limit = 50;
        }

        uint256 tipsLength = _tips.length;
        uint256 count = limit;
        if (count > tipsLength) {
            count = tipsLength;
        }

        Tip[] memory recent = new Tip[](count);
        for (uint256 i = 0; i < count; ++i) {
            recent[i] = _tips[tipsLength - 1 - i];
        }

        return recent;
    }
}

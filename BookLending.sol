// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

/// @title Decentralized Book Lending System for University Libraries
/// @notice System for adding, borrowing, and returning library books
contract BookLending {
    address public owner;

    struct Book {
        uint id;
        string title;
        string author;
        bool available;
        address borrower;
        uint dueDate; // timestamp
    }

    uint public bookCount = 0;
    mapping(uint => Book) public books;

    // ======== LIBRARIAN SYSTEM =========
    mapping(address => bool) public librarians;
    address[] public librarianList;  // NEW for listing

    // ======== EVENTS =========
    event BookAdded(uint bookId, string title, string author);
    event BookRemoved(uint bookId);
    event BookBorrowed(uint bookId, address borrower, uint dueDate);
    event BookReturned(uint bookId, address borrower);

    event LibrarianAdded(address librarian);
    event LibrarianRemoved(address librarian);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyLibrarianOrOwner() {
        require(msg.sender == owner || librarians[msg.sender], "Only librarian or owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
        librarians[msg.sender] = true;
        librarianList.push(msg.sender); // owner menjadi librarian pertama
        emit LibrarianAdded(msg.sender);
    }

    // ================================
    //   LIBRARIAN MANAGEMENT (UPDATED)
    // ================================

    function addLibrarian(address _librarian) public onlyOwner {
        require(_librarian != address(0), "Invalid address");
        require(!librarians[_librarian], "Already librarian");

        librarians[_librarian] = true;
        librarianList.push(_librarian);

        emit LibrarianAdded(_librarian);
    }

    function removeLibrarian(address _librarian) public onlyOwner {
        require(librarians[_librarian], "Not a librarian");

        librarians[_librarian] = false;
        emit LibrarianRemoved(_librarian);
    }

    /// @notice Get the full list of librarians (for frontend)
    function getLibrarians() public view returns (address[] memory) {
        return librarianList;
    }

    // ================================
    //        BOOK MANAGEMENT
    // ================================

    function addBook(string memory _title, string memory _author) public onlyLibrarianOrOwner {
        bookCount++;
        books[bookCount] = Book({
            id: bookCount,
            title: _title,
            author: _author,
            available: true,
            borrower: address(0),
            dueDate: 0
        });

        emit BookAdded(bookCount, _title, _author);
    }

    function removeBook(uint _bookId) public onlyLibrarianOrOwner {
        Book storage b = books[_bookId];
        require(b.id != 0, "Book not found");
        require(b.available == true, "Book currently borrowed");

        delete books[_bookId];

        emit BookRemoved(_bookId);
    }

    function borrowBook(uint _bookId, uint _durationSeconds) public {
        Book storage b = books[_bookId];
        require(b.id != 0, "Book not found");
        require(b.available == true, "Book not available");
        require(_durationSeconds > 0, "Invalid duration");

        b.available = false;
        b.borrower = msg.sender;
        b.dueDate = now + _durationSeconds;

        emit BookBorrowed(_bookId, msg.sender, b.dueDate);
    }

    function returnBook(uint _bookId) public {
        Book storage b = books[_bookId];
        require(b.id != 0, "Book not found");
        require(b.available == false, "Book not borrowed");
        require(b.borrower == msg.sender, "Only borrower can return");

        address borrowerAddr = b.borrower;

        b.available = true;
        b.borrower = address(0);
        b.dueDate = 0;

        emit BookReturned(_bookId, borrowerAddr);
    }

    function extendDueDate(uint _bookId, uint _extraSeconds) public {
        Book storage b = books[_bookId];
        require(b.id != 0, "Book not found");
        require(b.available == false, "Book not borrowed");
        require(b.borrower == msg.sender, "Only borrower can extend");
        require(_extraSeconds > 0, "Invalid extension");

        b.dueDate += _extraSeconds;

        emit BookBorrowed(_bookId, msg.sender, b.dueDate);
    }

    function getBook(uint _bookId)
        public
        view
        returns (
            uint id,
            string memory title,
            string memory author,
            bool available,
            address borrower,
            uint dueDate
        )
    {
        Book storage b = books[_bookId];
        require(b.id != 0, "Book not found");

        return (b.id, b.title, b.author, b.available, b.borrower, b.dueDate);
    }

    function isLibrarian(address _addr) public view returns (bool) {
        return librarians[_addr];
    }
}

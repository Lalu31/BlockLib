const BookLending = artifacts.require("BookLending");

contract("BookLending", accounts => {
  it("should add, borrow, and return a book correctly", async () => {
    const instance = await BookLending.deployed();
    await instance.addBook("Blockchain Basics", "Alice", { from: accounts[0] });
    const count = await instance.bookCount();
    assert.equal(count.toNumber(), 1, "Book count should be 1");

    await instance.borrowBook(1, 3600, { from: accounts[1] });
    let book = await instance.getBook(1);
    assert.equal(book[3], false, "Book should not be available");

    await instance.returnBook(1, { from: accounts[1] });
    book = await instance.getBook(1);
    assert.equal(book[3], true, "Book should be available again");
  });
});

App = {
  web3Provider: null,
  contracts: {},
  account: null,
  loading: false,

  load: async () => {
    console.log("App started...");
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      console.log("✅ Web3 detected via MetaMask");
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(window.web3.currentProvider);
      console.log("✅ Web3 injected (legacy)");
    } else {
      alert("⚠️ Please install MetaMask to use this DApp.");
    }
  },

  loadAccount: async () => {
    const accounts = await web3.eth.getAccounts();
    App.account = accounts[0];
    $("#accountAddress").html(`Connected account: <b>${App.account}</b>`);
  },

  loadContract: async () => {
    const bookLendingJSON = await $.getJSON('BookLending.json');
    App.contracts.BookLending = TruffleContract(bookLendingJSON);
    App.contracts.BookLending.setProvider(App.web3Provider);
    App.BookLending = await App.contracts.BookLending.deployed();
    console.log("📘 Contract loaded:", App.BookLending.address);
  },

  render: async () => {
    if (App.loading) return;
    App.setLoading(true);

    await App.renderBooks();
    await App.renderLibrarians();  // 🔥 fitur baru: tampilkan daftar librarian

    App.setLoading(false);
  },

  setLoading: (isLoading) => {
    App.loading = isLoading;
    const loader = $("#loader");
    const content = $("#content");
    if (isLoading) {
      loader.show();
      content.hide();
    } else {
      loader.hide();
      content.show();
    }
  },

  // ======================= BOOK TABLE ============================
  renderBooks: async () => {
    const count = await App.BookLending.bookCount();
    const $list = $("#booksList");
    $list.empty();

    for (let i = 1; i <= count; i++) {
      const b = await App.BookLending.books(i);
      const available = b[3] ? "✅ Tersedia" : "❌ Dipinjam";
      const borrower = b[4] === "0x0000000000000000000000000000000000000000" ? "-" : b[4];
      const dueDate = b[5].toNumber() === 0 ? "-" : new Date(b[5] * 1000).toLocaleString();

      const row = `
        <tr>
          <td>${b[0]}</td>
          <td>${b[1]}</td>
          <td>${b[2]}</td>
          <td>${available}</td>
          <td>${borrower}</td>
          <td>${dueDate}</td>
        </tr>`;
      $list.append(row);
    }
  },

  // ======================= LIBRARIAN LIST ============================
  renderLibrarians: async () => {
    const $list = $("#librarianList");
    $list.empty();

    const librarians = await App.BookLending.getLibrarians();

    let index = 1;

    librarians.forEach(addr => {
      const row = `
        <tr>
          <td>${index++}</td>
          <td>${addr}</td>
        </tr>
      `;
      $list.append(row);
    });
  },

  // ======================= FORM HANDLERS ============================
  bindEvents: () => {
    $("#addBookForm").submit(async (e) => {
      e.preventDefault();
      const title = $("#bookTitle").val();
      const author = $("#bookAuthor").val();
      await App.BookLending.addBook(title, author, { from: App.account });
      alert("📗 Buku berhasil ditambahkan!");
      window.location.reload();
    });

    $("#borrowForm").submit(async (e) => {
      e.preventDefault();
      const id = $("#borrowBookId").val();
      const duration = $("#durationSeconds").val();
      await App.BookLending.borrowBook(id, duration, { from: App.account });
      alert("📕 Buku berhasil dipinjam!");
      window.location.reload();
    });

    $("#returnForm").submit(async (e) => {
      e.preventDefault();
      const id = $("#returnBookId").val();
      await App.BookLending.returnBook(id, { from: App.account });
      alert("📘 Buku dikembalikan!");
      window.location.reload();
    });

    $("#addLibrarianForm").submit(async (e) => {
      e.preventDefault();
      const addr = $("#librarianAddr").val();
      await App.BookLending.addLibrarian(addr, { from: App.account });
      alert("👩‍🏫 Librarian baru berhasil ditambahkan!");
      window.location.reload();
    });
  },
};

$(window).on('load', async () => {
  await App.load();
  App.bindEvents();
  if (window.ethereum) {
    ethereum.on('accountsChanged', () => window.location.reload());
  }
});

const promptSync = require("prompt-sync")();
const mysql2 = require('mysql2');

const conn = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "library"
});

// function to retrieve all books from the database
function getAllBooks() {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM books";
        conn.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results); // array of objects
            }
        });
    });
}

// function to get all books of a user
function getUserBooks(user_name) {
    return new Promise((resolve,reject) => {
        const query = "SELECT bookName FROM user_books WHERE userName = ?";
        conn.query(query,[user_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to add user to database
function addUser(user_name) {
    return new Promise((resolve,reject) => {
        const query = "INSERT INTO users(name) values(?)";
        conn.query(query,[user_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to map book to the respective user
function userBooksMapping(user_name,book_name) {
    return new Promise((resolve,reject) => {
        const query = "insert into user_books(userName,bookName) values(?,?)";
        conn.query(query,[user_name,book_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to get all books of a user
function getAllUserBooks() {
    return new Promise((resolve,reject) => {
        const query = "SELECT * FROM user_books";
        conn.query(query,(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to update book quantity in the database
function updateBookQuantity(book_name,toBorrow,toReturn) {
    return new Promise((resolve, reject) => {
        let query = "";
        if(toBorrow === true) {
            query = "UPDATE books SET quantityAvailable = quantityAvailable - 1 WHERE bookName = ?";
        } else if(toReturn === true) {
            query = "UPDATE books SET quantityAvailable = quantityAvailable + 1 WHERE bookName = ?";
        }
        conn.query(query, [book_name], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// function to delete books after the user returns it
function deleteUserBooksMapping(user_name,book_name) {
    return new Promise((resolve,reject) => {
        const query = "DELETE FROM user_books where userName = ? AND bookName = ?";
        conn.query(query,[user_name,book_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}



async function verifyUserBookMapping(user_name,book_name) {
    // find if the user has such book
    await getAllUserBooks();

    try {
        const results = await new Promise((resolve,reject) => {
            const query = "SELECT 1 FROM user_books WHERE userName = ? AND bookName = ?";
            conn.query(query,[user_name,book_name],(error,results) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if(results.length === 0) {
            return false;
        }

        return true;

    } catch(error) {
        console.error("Error while checking if user has :",book_name,"\n",error);
    }
}

async function shelfIsEmpty(user_name) {
    const res = await new Promise((resolve,reject) => {
        conn.query("select bookName from user_books where userName = ?",[user_name],(error,results) => {
            if(error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });

    if(res.length === 0) {
        return true;
    } else {
        return false;
    }
}

async function displayAvailableBooks() {
    try {
        const allBooks = await getAllBooks();
        console.log("========== Available Books ==========\n");
        let i = 1;
        allBooks.forEach((bookDetails) => {
            console.log(i++ + "." + bookDetails.bookName + " (" + bookDetails.quantityAvailable + ")\n");
        });
        console.log("=====================================\n");
    } catch (error) {
        console.error("Error retrieving books:", error);
    }
}

async function displayBooksAndMenu(user_name) {
    try {
        const allBooks = await getAllBooks();
        console.log("\n---------------------------------------\n");
        console.log("LIBRARY MANAGEMENT SYSTEM\n");
        console.log("========== Available Books ==========\n");
        let i = 1;
        allBooks.forEach((bookDetails) => {
            console.log(i++ + "." + bookDetails.bookName + " (" + bookDetails.quantityAvailable + ")\n");
        });
    } catch (error) {
        console.error("Error retrieving books:", error);
    }

    console.log("================ Library Menu ===============");
    console.log("1. Display Available Books");
    console.log("2. Borrow a Book");
    console.log("3. Return a Book");
    console.log("4. My Books");
    console.log("5. Exit");
    console.log("\nYou: ",user_name);
    console.log("==============================================");
}

async function borrowBook(user_name) {
    const choice = promptSync("Enter the name of the book you'd like to borrow: ");
    try {
        const userBooks = await getUserBooks(user_name);
        const userHasBook = userBooks.find((book) => book.bookName === choice);
        if(userHasBook) {
            console.log(choice,"has already been lent to you");
            return;
        }

        const allBooks = await getAllBooks();

        const bookDetails = allBooks.find((book) => book.bookName === choice);

        if (!bookDetails) {
            console.log(choice, "is not available right now");
            return;
        }

        if (bookDetails.quantityAvailable <= 0) {
            console.log("Sorry, the book is currently out of stock.");
            return;
        }

        await userBooksMapping(user_name,choice);

        console.log("==========================================");
        console.log("You have successfully borrowed", choice);

        await updateBookQuantity(choice,true,false); // toBorrow,toReturn
    } catch (error) {
        console.error("Error borrowing a book:", error);
    }
}

async function returnBook(user_name) {
    try {
        await displayUserBooks(user_name);

        if(await shelfIsEmpty(user_name)) {
            return;
        }

        const book_name = promptSync("Enter the name of the book you'd like to return: ");

        const isPresent = await verifyUserBookMapping(user_name,book_name);

        if(!isPresent) {
            console.log("you don't have that book");
            return;
        }

        await deleteUserBooksMapping(user_name,book_name);
        
        await updateBookQuantity(book_name,false,true); // isBorrow,isReturn

        console.log("thank you for returning",book_name);
    } catch(error) {
        console.error("Error returning book",error)
    }
}

async function verifyUser(user) {
    try {
        const results = await new Promise((resolve,reject) => {
            const query = "SELECT 1 FROM users WHERE name = ?";
            conn.query(query,[user],(error,results) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if(results.length === 0) {
            return false;
        }
        return true;
    } catch(error) {
        console.log("Error verifying user:",error);
    }
}

async function displayUserBooks(user_name) {
    const myBooks = await getUserBooks(user_name);
    if(myBooks.length === 0) {
        console.log("\n[Your shelf is empty]\n")
    }
    else {
        console.log("\n=========== Your Shelf ============\n");
        let i = 1;
        let books = "";
        myBooks.forEach((bookDetails) => {
            console.log(i++ + "." + bookDetails.bookName + "\n");
        });
        console.log("===================================\n");
    }
}

// Define the main application logic
async function app() {
    let run = false;

    let session_user = promptSync("Enter your username: ");

    while(run !== true) {
        if(await verifyUser(session_user)) {
            run = true;
        } else {
            console.log("user does not exist");
            session_user = promptSync("Enter your username: ");
        }
    }

    while (run === true) {
        await displayBooksAndMenu(session_user);
        const menu_choice = promptSync("Enter an option: ");

        switch (menu_choice) {
            case "1":
                await displayBooksAndMenu(session_user);
                break;
            case "2":
                await displayAvailableBooks();
                await borrowBook(session_user);
                break;
            case "3":
                await returnBook(session_user);
                break;
            case "4":
                await displayUserBooks(session_user);
                break;
            case "5":
                process.exit();
            default:
                console.log("Invalid Option");
        }
    }

}

// Start the application
app();
// console.log("reached the end");

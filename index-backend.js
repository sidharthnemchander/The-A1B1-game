async function fetchRandomWord() {
    const response = await fetch("https://random-word-api.herokuapp.com/word?number=1&length=5");
    const words = await response.json();
    return words[0].toUpperCase(); // Assuming the API returns an array of words
}

var height = 10;
var width = 5;

var hint = "";
var row = 0;
var col = 0;
var w_dash = 0;

var gameover = false;
var word ;
var word_stack = [];
var dashword = ['_', '_', '_', '_', '_'];

document.addEventListener('DOMContentLoaded', async function() {
    console.log("The initial event listener is working");

    const helpButton = document.getElementById('help');
    const photoContainer = document.getElementById('image-slider');
    let imageSlider = null;

    helpButton.addEventListener('click', function() {
        console.log("the help button event listener is working");
        if (photoContainer.style.display === 'none' || photoContainer.style.display === '') {
            photoContainer.style.display = 'flex';
            if (!imageSlider) { // Create a new Splide instance only if it doesn't exist
                imageSlider = new Splide('#image-slider', {
                    type: 'loop',
                    perPage: 1,
                    autoplay: true,
                    arrows:false,
                    pagination:false,
                });
                imageSlider.mount(); // Mount the new Splide instance
            }
        } else {
            photoContainer.style.display = 'none';
            if (imageSlider) {
                imageSlider.destroy(); // Destroy the Splide instance if it exists
                imageSlider = null; // Reset imageSlider variable
            }
        }
    });

    word = await fetchRandomWord();
    console.log(word);
    initialize();
    addColumns();

    console.log("Before Splide initialization");
    const splide = new Splide('.splide', {
        type: 'loop',
        perPage: 1,
        autoplay: true,
    }).mount(); // Mount the Splide instance immediately
    console.log("After Splide initialization");

    document.getElementById('help').addEventListener('click', function() {
        document.getElementById('image-slider').classList.remove('hidden');
    });
});




function initialize() {
    // Event listener for main board input
    document.addEventListener("keyup", (e) => {
        if (gameover) return;

        if (document.activeElement.id !== "hidden-input") {
            handleBoardInput(e);
        }

    });

    const hiddenInput = document.getElementById("hidden-input");
    hiddenInput.addEventListener("input", handleDashInput);
    hiddenInput.addEventListener("keydown", handleDashBackspace);

    document.addEventListener("click", (e) => {
        if (!e.target.classList.contains("dash")) {
            document.querySelectorAll(".dash").forEach(dash => dash.classList.remove("focused"));
        }
    });
}

async function handleBoardInput(e) {
    let keyPressed = e.key.toUpperCase();
    console.log("Key Pressed:", keyPressed); // Log the key pressed

    if (e.key.length === 1 && keyPressed >= 'A' && keyPressed <= 'Z') {
        // Handling letter keys for the main board
        if (row < height && col < width) {
            let currTile = document.getElementById(row.toString() + '-' + col.toString());
            if (currTile && currTile.innerText == "") {
                currTile.innerText = keyPressed;
                word_stack.push(keyPressed);
                col += 1;
                animateTile(currTile); // Add animation to the tile
            }
        }
        console.log("Current word stack:", word_stack);
    } else if (e.key === "Backspace") {
        e.preventDefault(); // Prevents the default behavior of backspace (navigating back in the browser)
        if (col > 0) {
            col -= 1;
            let currTile = document.getElementById(row.toString() + "-" + col.toString());
            currTile.innerText = "";
            word_stack.pop();
        }
        console.log("Current word stack after backspace:", word_stack);
    } else if (e.key === "Enter" && col > 0 && col % 5 == 0) {
        e.preventDefault(); // Prevents the default behavior of enter (form submission, etc.)
        console.log("Enter pressed. Current word stack:", word_stack);
        if (word_stack.length === 5) {
            let userword=word_stack.join("");
            let isvalid= await checkWordValidity(userword);

            if(isvalid){
                hint = CheckLogic(word_stack.join(''), word);
                console.log("Hint:", hint);
                document.getElementById(row.toString() + '-hint').innerText = hint;
                document.getElementById(row.toString() + '-hint').classList.add('animate-hint'); // Add animation class
                setTimeout(() => document.getElementById(row.toString() + '-hint').classList.remove('animate-hint'), 1000); // Remove animation class after animation completes
                word_stack = [];
                row += 1;
                col = 0;
                if (row < height) {
                    addColumns(); // Execute addColumns when "Enter" key is pressed and col is a multiple of 5
                } else {
                    gameOver();
                }
            }
            else{
                showMessageBox("U sure its a real word?");
            }

        }

    }

    console.log("Row:", row); // Log the current row
    console.log("Column:", col); // Log the current column
}

async function checkWordValidity(u_word) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${u_word}`);
    if (response.ok) {
        const data = await response.json();
        return data.length > 0;
    }else{
        word_stack=[];
    }
    return false;
}

function showMessageBox(message) {
    const messageBox = document.getElementById('message-box');
    messageBox.innerText = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 2000);
}

function handleDashInput(e) {
    const keyPressed = e.target.value.toUpperCase();
    console.log("Hidden input value:", keyPressed);

    if (keyPressed.length === 1 && keyPressed >= 'A' && keyPressed <= 'Z' && w_dash < 3) {
        const focusedDash = document.querySelector(".dash.focused");
        if (focusedDash) {
            const index = focusedDash.dataset.index;
            dashword[index] = keyPressed;
            if (dashword[index] == word[index]) {
                focusedDash.innerText = keyPressed;
                animateDash(focusedDash); // Add animation to the dash
                console.log("Dashword:", dashword);
                checkdashwin(dashword.join(''), word);
            } else {
                console.log('wrong letter in dash', w_dash);
                wrongdash();
            }
        }
    }
    e.target.value = ""; // Clear the input
}

function handleDashBackspace(e) {
    if (e.key === "Backspace") {
        e.preventDefault(); // Prevent default behavior of Backspace
        const focusedDash = document.querySelector(".dash.focused");
        if (focusedDash) {
            const index = focusedDash.dataset.index;
            dashword[index] = '_';
            focusedDash.innerText = '';
            console.log("Dashword after backspace:", dashword);
        }
    }
}

function focusInput(dashElement) {
    const hiddenInput = document.getElementById("hidden-input");
    document.querySelectorAll(".dash").forEach(dash => dash.classList.remove("focused"));
    dashElement.classList.add("focused");
    hiddenInput.focus();
}

function addColumns() {
    const board = document.getElementById("board");

    // Create a new row div
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("row");
    rowDiv.classList.add("animate-row"); // Add the animation class

    for (let c = 0; c < width; c++) {
        const tile = document.createElement("span");
        tile.classList.add("tile");
        tile.innerText = "";
        tile.id = row.toString() + '-' + c.toString(); // Assigning ID
        rowDiv.appendChild(tile);
    }

    // Add a span for the hint at the end of the row
    const hintSpan = document.createElement("span");
    hintSpan.classList.add("hint");
    hintSpan.id = row.toString() + '-hint';
    rowDiv.appendChild(hintSpan);

    board.appendChild(rowDiv);
}


function CheckLogic(userword, word) {
    let size = 5;
    let A = 0;
    let B = 0;

    for (let i = 0; i < size; i++) {
        if (word[i] === userword[i]) {
            A++;
        }
    }

    for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
            if (j === k) {
                continue;
            } else if (userword[j] === word[k]) {
                B++;
            }
        }
    }

    if (A === 5) {
        GameWin();
        return `A${A}B${B}`;
    } else if (A > 0 || B > 0) {
        console.log(`A${A}B${B}`);
        return `A${A}B${B}`;
    } else {
        return "0";
    }
}

function wrongdash() {
    const circles = document.querySelectorAll(".error-circle");
    if (w_dash < circles.length) {
        circles[w_dash].style.backgroundColor = "red";
        circles[w_dash].classList.add('animate-circle'); // Add animation class
        setTimeout(() => circles[w_dash].classList.remove('animate-circle'), 500); // Remove animation class after animation completes
        w_dash++;
    }
}

function checkdashwin(dashword, word) {
    if (dashword === word) {
        GameWin();
    }
}

function GameWin() {
    console.log("You've won the game!");

    const winMessage = document.getElementById("game-win-message");
    winMessage.classList.remove("hidden");
    winMessage.classList.add("animate-win");

    // Confetti effect
    var duration = 5 * 1000; // Duration of confetti in milliseconds
    var end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function gameOver() {
    gameover = true;
    document.getElementById("word-display").innerText = word;
    document.getElementById("game-over-popup").classList.remove("hidden");
}

// Ensure this function is available for the game over scenario
function resetGame() {
    gameover = false;
    row = 0;
    col = 0;
    word_stack = [];
    document.getElementById("board").innerHTML = "";
    document.getElementById("answer").innerText = "";
    addColumns();
}

function animateTile(tile) {
    tile.classList.add('animate-tile');
    setTimeout(() => tile.classList.remove('animate-tile'), 300); // Remove animation class after animation completes
}

function animateDash(dash) {
    dash.classList.add('animate-dash');
    setTimeout(() => dash.classList.remove('animate-dash'), 300); // Remove animation class after animation completes
}

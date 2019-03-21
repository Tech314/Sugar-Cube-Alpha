//=============================================//
//		       Sugar Cube Alpha	   			   //
//		   	   By: Kyle Magdales			   //
//		    Made for the purposes of 		   //
//     Revature Full Stack 12 Week Program	   //
//			  and world domination			   //
//=============================================//

//Global Variables
var game = document.getElementById("board");					//DOM selection: getting canvas from html
var gameContext = game.getContext("2d");						//access methods for drawing in canvas
var screen = document.getElementById("pongBackground");			//img element containing background for canvas
var leftEdge = document.getElementById("coffeeleft");			//img element containing image for left coffee cup
var rightEdge = document.getElementById("coffeeright");			//img element containing image for right coffee cup
gameContext.font = "50px Comic Sans MS";		//sets font of text to 50 pixel Comic Sans font
gameContext.fillStyle = "white";				//sets color of text to white

var leftPaddle = new Paddle("Left");		//creates the left paddle
var rightPaddle = new Paddle("Right");		//creates the right paddle
var ball = new Ball();						//creates the ball
var gameEng;								//declaring variable to handle game running/paused
var ballEng;								//declaring variable to handle ball speed incrementing
var singlePlayer = true;					//handles whether game is being played 1p or 2p
var keyPressed = [];						//array to handle mutliple keydown events at the same time

var playerScore = 0;			//initial player 1 score
var cpuScore = 0;				//initial cpu/player 2 score
var gamePaused = true;			//variable to handle pausing and unpausing game //game is initialized to paused state
var winner = false;				//variable for handling if score limit is reached
var scoreLim = 3;				//variable that sets score to win //3 by default //can be changed with setScoreLim()

var cols = {								//RGB of all colors for changePBColor()
	White:[255,255,255],
	BlueViolet:[138,43,226],
	Chartreuse:[223,255,0],
	Coral:[248,131,121],
	DarkGrey:[169,169,169],
	Gold:[212,175,55],
	Magenta:[202,31,123],
	DeepPink:[255,20,147],
	Teal:[0,128,128],
	Maroon:[80,0,1],
	Mauve:[224,176,255],
	Puce:[204,136,153]
}

var leftPaddleImg = gameContext.createImageData(leftPaddle.width, leftPaddle.height);		//creates image of left paddle
var rightPaddleImg = gameContext.createImageData(rightPaddle.width, rightPaddle.height);	//creates image of right paddle
var ballImg = gameContext.createImageData(ball.width, ball.height);							//creates image of ball

//Window events
window.onload = function(){
	gameContext.drawImage(screen,0,0,1100,500);				//draws background onto canvas
	gameContext.drawImage(leftEdge,0,0,45,500);				//draws the coffee cup on left edge
	gameContext.drawImage(rightEdge,1055,0,45,500);			//draws the coffee cup on right edge
	
	for(let i = 0; i < leftPaddleImg.data.length; i += 4){	//sets all pixels in paddles to white 100% solid
		leftPaddleImg.data[i+0] = 255;
		leftPaddleImg.data[i+1] = 255;
		leftPaddleImg.data[i+2] = 255;
		leftPaddleImg.data[i+3] = 255;
		rightPaddleImg.data[i+0] = 255;
		rightPaddleImg.data[i+1] = 255;
		rightPaddleImg.data[i+2] = 255;
		rightPaddleImg.data[i+3] = 255;
	}
	
	for(let i = 0; i < ballImg.data.length; i += 4){		//sets all pixels in ball to white 100 % solid
		ballImg.data[i+0] = 255;
		ballImg.data[i+1] = 255;
		ballImg.data[i+2] = 255;
		ballImg.data[i+3] = 255;
	}
	
	gameContext.fillText(playerScore, 250, 50);		//draws player score
	gameContext.fillText(cpuScore, 800, 50);		//draws cpu score
	gameContext.putImageData(leftPaddleImg, leftPaddle.x, leftPaddle.y);	//draws left paddle
	gameContext.putImageData(rightPaddleImg, rightPaddle.x, rightPaddle.y);		//draws right paddle
	gameContext.putImageData(ballImg, ball.x, ball.y);		//draws ball
}

window.addEventListener("keydown",keyWasPressed);		//sets keyPressed[key value] to true when key is pressed down

window.addEventListener("keyup",keyWasReleased);		//sets keyPressed[key value] to false when key is released

function keyWasPressed(e){
	keyPressed[e.keyCode] = true;						//index of key value is set to true
	
	if(keyPressed[16] && !winner){		//if either shift key is pressed and there isn't a winner
		if(gamePaused){			//unpauses game
			gameEng = window.setInterval(engine,15);		//calls and executes engine function every 15 milliseconds
			ballEng = window.setInterval(incrementBallSpeed,21000);			//calls and executes incrementBallSpeed every 21 seconds
			gamePaused = false;
		}
		else{					//pauses game
			window.clearInterval(gameEng);
			window.clearInterval(ballEng);
			gamePaused = true;
		}
	}
	if(keyPressed[82]){			//if r is pressed
		if(!gamePaused){		//pauses game if game is running
			window.clearInterval(gameEng);
			window.clearInterval(ballEng);
			gamePaused = true;
		}
		//reset game state
		resetBall();
		leftPaddle.y = (game.height/2) - 45;
		rightPaddle.y = (game.height/2) - 45;
		playerScore = 0;
		cpuScore = 0;
		winner = false;
		
		redraw();
	}
}

function keyWasReleased(e){
	keyPressed[e.keyCode] = false;		//sets index of keyPressed to false
}

function engine(){		//updates the gamescreen	
	checkCollision();			//checks for collision with top/bottom border or left/right paddle
	moveBall();					//moves ball based on x and y speed
	
	if(singlePlayer){
		computerMove();				//handles movement for cpu paddle
	}
	
	if(keyPressed[87] || keyPressed[83]){		//calls moveLeftPaddle() if w or s is pressed
		moveLeftPaddle();
	}
	
	if((keyPressed[73] || keyPressed[75]) && !singlePlayer){		//calls moveRightPaddle() if i or k is pressed and 2 player is chosen
		moveRightPaddle();
	}
	
	redraw();		//redraws all elements in canvas
	checkScore();				//checks if score condition met and updates score if necessary
}

//Class Declarations
function Ball(){	//Ball Object
	//Properties
	this.x = (game.width/2)-8; //sets initial point to middle of screen horizontally
	this.y = (game.height/2)-8; //sets initial point to middle of screen vertically
	this.width = 15; //sets ball width to 15 pixels
	this.height = 15; //sets ball height to 15 pixels
	let randX = getRandomInt(3);
	let randY = getRandomInt(3);
	let randDir = getRandomInt(4);
	if(randDir == 0){
		this.xDirection = -(randX+2);	//sets initial x direction
		this.yDirection = -(randY+2); 	//sets initial y direction
	}
	else if(randDir == 1){
		this.xDirection = randX+2;	//sets initial x direction
		this.yDirection = -(randY+2); 	//sets initial y direction
	}
	else if(randDir == 2){
		this.xDirection = -(randX+2);	//sets initial x direction
		this.yDirection = randY+2; 	//sets initial y direction
	}
	else{
		this.xDirection = randX+2;	//sets initial x direction
		this.yDirection = randY+2; 	//sets initial y direction
	}
}

function Paddle(side){	//Paddle Object
	if(side == "Left"){
		this.x = 85;	//sets paddle 85 pixel from left edge 
	}
	else{
		this.x = game.width-95;	//sets paddle 85 pixels from right edge
	}
	this.y = (game.height/2) - 45;	//sets paddle to middle of screen vertically
	this.width = 10;	//sets width of paddle to 10 pixels
	this.height = 90;	//sets height of paddle to 90 pixels
}

//functions
function moveLeftPaddle(){
	if(keyPressed[87]){		//moves left paddle up
		if(leftPaddle.y > 0){		//checks if paddle is against top border
			leftPaddle.y -= 3;
		}
	}
	else if(keyPressed[83]){	//moves left paddle down
		if(leftPaddle.y < 410){		//checks if paddle is against bottom border
			leftPaddle.y += 3;
		}
	}
}

function moveRightPaddle(){
	if(keyPressed[73]){		//moves right paddle up
		if(rightPaddle.y > 0){		//checks if paddle is against top border
			rightPaddle.y -= 3;
		}
	}
	else if(keyPressed[75]){	//moves right paddle down
		if(rightPaddle.y < 410){		//checks if paddle is against bottom border
			rightPaddle.y += 3;
		}
	}
}

function moveBall(){					//increments ball position based on xDirection and yDirection properties
	ball.x += ball.xDirection;
	ball.y += ball.yDirection;
}

function incrementBallSpeed(){				//increases ball speed in each direction by 1 up to max of 9
	if(Math.abs(ball.xDirection) < 10){
		if(ball.xDirection>0){
			ball.xDirection++;
		}
		else{
			ball.xDirection--;
		}
	}
	
	if(Math.abs(ball.yDirection) < 10){
		if(ball.yDirection>0){
			ball.yDirection++;
		}
		else{
			ball.yDirection--;
		}
	}
}

function computerMove(){		//compares center of ball to center of paddle
	if((ball.y+8) > (rightPaddle.y+45)){			//moves down if ball is below paddle
		if(rightPaddle.y < 410){		//checks if paddle is against top border
			rightPaddle.y += 3;
		}
	}
	else if((ball.y+8) < (rightPaddle.y+45)){		//moves up if ball is above paddle
		if(rightPaddle.y > 0){
			rightPaddle.y -= 3;
		}
	}
}

function checkCollision(){
	//check collision with left paddle
	if(ball.x <= 95 && ball.x >= 85){
		if((ball.y+15) >= leftPaddle.y && (ball.y) <= (leftPaddle.y+90)){
			if((ball.y+15 <= leftPaddle.y+9 && ball.yDirection > 0) || (ball.y >= leftPaddle.y+81 && ball.yDirection < 0)){
				ball.yDirection *= -1;
			}
			ball.xDirection *= -1;
		}
	}
	
	//check collision with right paddle
	if((ball.x+15 >= rightPaddle.x) && (ball.x+15 <= rightPaddle.x+10)){
		if((ball.y+15) >= rightPaddle.y && (ball.y) <= (rightPaddle.y+90)){
			if((ball.y+15 <= rightPaddle.y+9 && ball.yDirection > 0) || (ball.y >= rightPaddle.y+81 && ball.yDirection < 0)){
				ball.yDirection *= -1;
			}
			ball.xDirection *= -1;
		}
	}
	
	//check collision with top and bottom borders
	if(ball.y <= 0 || (ball.y+15) >= 500){
		ball.yDirection *= -1;
	}
}

function checkScore(){
	if(ball.x <= 0){		//if the ball hits the left bound
		cpuScore++;
		resetBall();	//resets the ball
	}
	else if(ball.x >= 1100){		//if the ball hits the right bound
		playerScore++;
		resetBall();	//resets the ball
	}
	
	checkWinner();		//checks to see if score caused a player to win
}

function checkWinner(){
	if(playerScore == scoreLim){
		window.clearInterval(gameEng);
		window.clearInterval(ballEng);
		redraw();
		gameContext.fillText("Player 1 Wins", 390, 225);
		winner = true;
	}
	if(cpuScore == scoreLim){
		window.clearInterval(gameEng);
		window.clearInterval(ballEng);
		redraw();
		gameContext.fillText("Player 2 Wins", 390, 225);
		winner = true;
	}
}

function resetBall(){
	let randX = getRandomInt(3);
	let randY = getRandomInt(3);
	ball.x = (game.width/2)-8; 
	ball.y = (game.height/2)-8; 
	let randDir = getRandomInt(4);
	if(randDir == 0){
		ball.xDirection = -(randX+2);	//sets initial x direction
		ball.yDirection = -(randY+2); 	//sets initial y direction
	}
	else if(randDir == 1){
		ball.xDirection = randX+2;	//sets initial x direction
		ball.yDirection = -(randY+2); 	//sets initial y direction
	}
	else if(randDir == 2){
		ball.xDirection = -(randX+2);	//sets initial x direction
		ball.yDirection = randY+2; 	//sets initial y direction
	}
	else{
		ball.xDirection = randX+2;	//sets initial x direction
		ball.yDirection = randY+2; 	//sets initial y direction
	}
}

//changes the background image of the gamescreen
function changeImage(imgId){
	screen = document.getElementById(imgId);	//DOM selection: img tag of chosen image
	redraw();
}

//changes color of the ball, paddles, and scores
function changePBColor(col){
	if(col != "Mauve" && col != "Puce"){
		gameContext.fillStyle = col;
	}
	else if(col == "mauve"){					//manually entered hex codes since not implemented
		gameContext.fillStyle = "#e0b0ff";
	}
	else{
		gameContext.fillStyle = "#CC8899";
	}
	
	let colArr;				//array to handle image data for ball and paddles
	switch(col){			//sets colArr to be equal to Color array in cols object
		case "White":
			colArr = cols.White;
			break;
		case "BlueViolet":
			colArr = cols.BlueViolet;
			break;
		case "Chartreuse":
			colArr = cols.Chartreuse;
			break;
		case "Coral":
			colArr = cols.Coral;
			break;
		case "DarkGrey":
			colArr = cols.DarkGrey;
			break;
		case "Gold":
			colArr = cols.Gold;
			break;
		case "Magenta":
			colArr = cols.Magenta;
			break;
		case "DeepPink":
			colArr = cols.DeepPink;
			break;
		case "Teal":
			colArr = cols.Teal;
			break;
		case "Maroon":
			colArr = cols.Maroon;
			break;
		case "Mauve":
			colArr = cols.Mauve;
			break;
		case "Puce":
			colArr = cols.Puce;
			break;
		default:
			colArr = [80,0,1];
	}
	
	for(let i = 0; i < leftPaddleImg.data.length; i += 4){
		leftPaddleImg.data[i+0] = colArr[0];
		leftPaddleImg.data[i+1] = colArr[1];
		leftPaddleImg.data[i+2] = colArr[2];
		leftPaddleImg.data[i+3] = 255;
		rightPaddleImg.data[i+0] = colArr[0];
		rightPaddleImg.data[i+1] = colArr[1];
		rightPaddleImg.data[i+2] = colArr[2];
		rightPaddleImg.data[i+3] = 255;
	}
	
	for(let i = 0; i < ballImg.data.length; i += 4){
		ballImg.data[i+0] = colArr[0];
		ballImg.data[i+1] = colArr[1];
		ballImg.data[i+2] = colArr[2];
		ballImg.data[i+3] = 255;
	}
	
	redraw();
}

function redraw(){
	gameContext.drawImage(screen,0,0,1100,500);									//redraws the screen
	gameContext.drawImage(leftEdge,0,0,45,500);									//redraws the coffee cup on left edge
	gameContext.drawImage(rightEdge,1055,0,45,500);								//redraws the coffee cup on right edge
	gameContext.fillText(playerScore, 250, 50);									//redraws player score
	gameContext.fillText(cpuScore, 800, 50);									//redraws cpu score
	gameContext.putImageData(leftPaddleImg, leftPaddle.x, leftPaddle.y);		//redraws leftPaddle
	gameContext.putImageData(rightPaddleImg, rightPaddle.x, rightPaddle.y);		//redraws rightPaddle
	gameContext.putImageData(ballImg, ball.x, ball.y);							//redraws ball
}

function setNumPlayers(){					//changes number of players
	if(!gamePaused){							//pauses game if game is running
		window.clearInterval(gameEng);
		window.clearInterval(ballEng);
		gamePaused = true;
	}
	//resets game state
	resetBall();
	leftPaddle.y = (game.height/2) - 45;
	rightPaddle.y = (game.height/2) - 45;
	playerScore = 0;
	cpuScore = 0;
	redraw();
	
	//change number of players
	if(singlePlayer){
		singlePlayer = false;
	}
	else{
		singlePlayer = true;
	}
	
}

//changes score needed to win
function setScoreLim(lim){
	scoreLim = parseInt(lim);
	
	resetBall();
	leftPaddle.y = (game.height/2) - 45;
	rightPaddle.y = (game.height/2) - 45;
	playerScore = 0;
	cpuScore = 0;
	redraw();
}

//randomizer for ball direction, and x and y speeds
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
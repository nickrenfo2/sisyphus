//sis01.js 11/20/15 from plotfile3b.js
// new status scheme: waiting, playing, homing ...
// 

var Vball=2,  Accel = 2, MTV=.5, Vmin = 0.1; Voverride = 1;
var balls  = 1; //sis vs tant mode
//machine constants:
var plotRadius = 6.0, segRate=20; 
var thSPRev = 40888.89, rSPRev = 3200, rSPInch = 2573.284;
var nestedAxisSign = 1, thDirSign = 1, rDirSign = -1; 

var rthAsp = rSPRev / thSPRev; //r-th aspect ratio
var rCrit = Vball / MTV; console.log('rCrit: ' + rCrit)
var thSPRad = thSPRev / (2* Math.PI);
var accelSegs = Vball * segRate /(2 * Accel);  //console.log('accelSegs: '+accelSegs );
var VminSegs =	Vmin * segRate /(2 * Accel); // console.log('VminSegs:'+VminSegs);
var ASfin = accelSegs;
var ASindex = VminSegs; //accelSegs index
var baseMS = 1000/segRate; //msec per segment, no V adjustment

var STATUS = 'waiting'; //vs. playing, homing
var options = {  //user commands available
	pause : false,
	play : true,
	home : true,
	jog : true,
	speed : true,
	LED : true,
	content : true	
};

var plistLines = []; //array of playlist entries
var plistLine = {	
	name : 'default',
	V : 2,//default Vball
	A : 1,//default ACCEL
	MTV : 0.7// default maxthvel
}; //plist entry object
var plLinesMax = 0, PLINDEX = 0;

var verts = []; //array of path vertices
var vert = {th : 0, r : 0}; //vertex object
var  miMax, thAccum=0, rAccum=0; 
var pauseRequest= false;
//for serial port:
var serialPort = require("serialport");
var SerialPort = require("serialport").SerialPort;
var counter = 0;
var sp = new SerialPort("COM36");
//for keybord listener:
var stdin = process.stdin;
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );
var paused = true;
//pars stored for pause/resume:
var Rmi, RmiMax, Rsi, RsiMax, RthStepsSeg, RrStepsSeg;
var	RthLOsteps, RrLOsteps, ReLOth, ReLOr, RfracSeg;

var RDIST = 0, THRAD = 0, MOVEDIST = 0, RSEG = 0;
var RF2MIN = 1;
var JOGTHSTEPS = 100, JOGRSTEPS = 100;
var HOMETHSTEPS = 50 * thDirSign, HOMERSTEPS = 50 ;

var COUNTER =0;

var THETA_HOME_COUNTER = 0, THETA_HOMED, WAITING_THETA_HOMED;
var THETA_HOME_MAX =  Math.round(thSPRev * 1.03 / HOMETHSTEPS);//3% extra
var RHO_HOME_COUNTER = 0, RHO_HOMED, WAITING_RHO_HOMED;
var RHO_HOME_MAX =  Math.round(rSPInch * (plotRadius + 0.25) / HOMERSTEPS);// 1/4" extra
var RETESTCOUNTER = 0; RETESTNUM = 5;
var LED = 8; //brightness

var fs = require('fs');// for file reading
var plistRepeat = true;
var PLHOMED = false;
var NEWPLIST = true;


{//@@@@@@@@@@@@@@@@      Web Sockets Functions    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
var request = require('request');
var fs = require('fs');


//BEGIN CONFIGURATION ITEMS
var relPath = '.';
var connIp = '10.0.0.19';
// var connIp = 'cryptic-waters-5329.herokuapp.com';
var connPort = '3000';
// var connString = "https://"+connIp //use this for heroku

//This is the config object for this sisbot. playlists and paths are read from the filesystem
var mySisbot = {
	serial:'123ABD',
	sid:'1234',
	playlists:getFilesByTypeSync('pl'),
	paths:getFilesByTypeSync('thr')
}
//END CONFIGURATION ITEMS


var connString = "http://"+connIp+":"+connPort //use this for local network server
//connect to the socket on the server, given the above connection string. Send the serial number
var socket = require('socket.io-client')(connString,{query:'serial='+mySisbot.serial});
socket.on('connect',function(){
	console.log('connected');
	socket.emit('myConn',mySisbot); //update the server with all playlist and fath files
})

socket.on('test',function(){ //test function
	console.log('test recieved');
});

socket.on('statechange',function(state){ //whenever the state is changed from the server, this will be called
	console.log('state change acknowledged')
	console.log(state);
	
	if ((paused) && (state.status == 'play')) go();
	
	if ((!paused) && (state.status == 'pause')) pauseRequest = true;
	
	if (Voverride != state.speed) {
		if (state.speed <= 5) Voverride = Math.pow (0.55, 5 - state.speed);
		else Voverride = Math.pow (1.25, state.speed - 5);
		console.log(Voverride);
	}
	
		if (LED != state.lights) {
		LED = state.lights;
		setLED(LED);
	}
	

});

socket.on('jog',function(dir){
	console.log('jog dammit:',dir);
	jog(dir.axis,dir.dir);
	
});

socket.on('getPlaylist',function(plname){ //Used to update the server with playlist file contents
	console.log('playlist requested:',plname);
	var plContents = {
		name:plname,
		paths:getPlaylistContents(plname)
	}
	socket.emit('getPlaylist',plContents);
});

socket.on('getPath',function(pathname){ //Used to update the server with path file contents
	console.log('path requested:',pathname);
	socket.emit('getPath',readPath(pathname));
});

//Given the name of a playlist, it will attempt to read and parse the file
function getPlaylistContents(plname){
	contents = fs.readFileSync(relPath+'/'+plname+'.pl','utf8').trim();
	contents = contents.split('\r\n'); //split it by line
	var paths = [];
	for (var i=0;i<contents.length;i++){
		var myPath = contents[i];
		var commentStart = myPath.trim().indexOf('#') //if the line is a comment, remove the comment
		if (commentStart>=0){
			var temp = myPath.slice(commentStart);
			contents[i] = myPath.replace(temp,'');
		}
		if(contents[i]==''){ //if the line is empty, remove it
			contents.splice(i,1);
			i--;
		} else {
			contents[i] = myPath.replace('.thr',''); //remove file extension
			var pathdata = contents[i].split('\t');
			if (pathdata.length == 1&&pathdata[0].split(' ').length>1){ //If the file doesn't split by tab, split it by space
				pathdata = pathdata[0].split(' ');
				
				for (var j=0;j<pathdata.length;j++){//if the lines are empty, remove them
					if (!pathdata[j]){
						pathdata.splice(j,1);
						j--;
					}
				}
			}
			
			var pathObj = { 
				name:pathdata[0],
				vel:pathdata[1],
				accel:pathdata[2],
				thvmax:pathdata[3]
			}
			paths.push(pathObj);// add the parsed path data to the playlist
		}
	}
	
	return paths;

	console.log('playlist contents...:\n',contents);
	
}

//Get the list of files in Sisbot given the file type
//your call should look like getFilesByTypeSync('pl');
function getFilesByTypeSync(type){
	var files = fs.readdirSync(relPath);
	files = filterByExtension(files,type);
	for (var i=0;i<files.length;i++){
		files[i] = files[i].replace('.'+type,"");
	}
	
	return files
}

//Given a list of files, return only those of the given type
function filterByExtension(files,ext){
	return files.filter(function(file){return file.substr(ext.length*-1)===ext})
}

//Given a path file, parse it into the desired object for the db
function parsePath(path,name){
	// console.log(path.split('\r\n'));
	var obj = {};
	obj.name = name;
	obj.path = path.trim().split('\r\n');
	obj.steps = obj.path.length;
	obj.startR = getStartR(obj.path,name);
	obj.endR = getEndR(obj.path);
	return obj;
}

//given the array of a pathfile, get the starting position (R) of the path
//returns 1 or 0
function getStartR(pathArr){
	var startR = -1;
	var i =0;
	while (startR != 0 && startR !=1){
		startR = Math.round(pathArr[i].split(' ')[1]);
		i++;
	}
	return startR;
}


//given the array of a pathfile, get the ending position (R) of the path
//returns 1 or 0
function getEndR(pathArr){
	var endR = -1;
	var i =pathArr.length-1;
	while (endR != 0 && endR !=1){
		endR = Math.round(pathArr[i].split(' ')[1]);
		i--;
	}
	return endR;
}

function readPath(pathname){
	var file = fs.readFileSync(relPath+'/'+pathname+'.thr','utf8');
	
	return parsePath(file,pathname);
}

function getPlaylists(){
	return getFilesByTypeSync('pl');
}

function getPaths(){
	var paths = getFilesByTypeSync('thr');
	var pathsData = [];
	for (var i=0;i<paths.length;i++){
		var data = readPath(paths[i]);
		pathsData.push(data);
	}
	console.log('more something');
	console.log(pathsData);
	return pathsData;
}


//@@@@@@@@@@@@@@@@     End Web Sockets Functions    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
}

function changeOptions(newStatus){
	switch (newStatus) {
		case 'waiting':
			options = {  
				pause : false,
				play : true,
				home : true,
				jog : true,
				speed : true,
				LED : true,
				content : true
			};
			return;
			
		case 'playing':
			options = {  
				pause : true,
				play : false,
				home : false,
				jog : false,
				speed : true,
				LED : true,
				content : false	
			};
			return;
			
		case 'homing':
			options = {  
				pause : true,
				play : false,
				home : false,
				jog : false,
				speed : false,
				LED : true,
				content : false
			};
			return;
	}
}

//////      NEXTPlaylistLine    ///////////////////////////////////
function nextPlaylistLine(plLine_i, plLinesMax) {
	console.log('plindex pl=' + plLine_i);
	
	if (plLine_i == plLinesMax) {
		PLINDEX = 0;
		console.log('all playlist entries done');
		if (plistRepeat) {
			plLine_i = 0;
			//console.log('plindex ?' + plLine_i);
		}
		else {
			console.log('all playlist entries done, NO REPEAT');
			console.log('waiting for user to do something...');
			paused = true;
			return; //wait for user to do something...
		}  
	}
	
	console.log('plistLine name: ' + plistLines[plLine_i].name);
	
	if (plistLines[plLine_i].name == 'home') {
		console.log('homing,  from playlist');
		THETA_HOME_COUNTER = 0;
		RHO_HOME_COUNTER = 0;
		STATUS = 'homing';
		changeOptions(STATUS);
		PLHOMED = true;
		goThetaHome();
		return;				
	}
	else{ 
		
		pathName = plistLines[plLine_i].name;
		loadThR(plistLines[plLine_i].name, checkConformal);
		Vball = plistLines[plLine_i].V;
		Accel = plistLines[plLine_i].A;
		MTV = plistLines[plLine_i].MTV;
		
		//checkConformal();
		console.log('playing ' + plistLines[plLine_i].name);
		console.log('plist line index: ' + plLine_i);
		console.log("V = " + Vball + '  A = ' + Accel + '  MTV = ' + MTV);
		nextMove(0, miMax);
		
	}
}
//////      NEXTMOVE     ///////////////////////////////////
function nextMove(mi,miMax) {
	var moveThRad, moveRdist, moveThDist, moveDist; 
	var segsReal, segs, fracSeg = 1.0;
	var thStepsOld, thStepsNew, thStepsMove, thStepsSeg, thLOsteps; 
	var rStepsOld, rStepsNew, rStepsMove, rStepsComp, rStepsSeg, rLOsteps;
	var thOld, rOld, thNew, rNew;
	var headingNow;
	
	if (mi==miMax){
		console.log('all moves done');
		socket.emit('pathcomplete');
		//console.log('thAccum = ' + thAccum);
		//console.log('rAccum = ' + rAccum);
		console.log(verts);
		verts = []; //clear verts array
		PLINDEX++; //console.log('PLINDEX=' + PLINDEX);
		nextPlaylistLine(PLINDEX, plLinesMax);
		return;
	}
		
	thOld = verts[mi].th; rOld = verts[mi].r;
	if (mi == 0){
		//RSEG = rOld*plotRadius; // just for now, set rSeg to first r in file
	}
	thNew = verts[mi+1].th; rNew= verts[mi+1].r; 
		
	moveThRad = thNew - thOld; 	
	THRAD = moveThRad;
	moveRdist = (rNew - rOld) * plotRadius; 
	RDIST = moveRdist;
	
	moveThDist = moveThRad * rCrit; 
	moveDist = Math.sqrt((moveThDist * moveThDist) +
											 (moveRdist * moveRdist)); 
	MOVEDIST = moveDist;
											 
	headingNow = Math.atan2(moveRdist, moveThDist);
	
	if(mi<miMax-1) lookAhead(mi, headingNow);
	else ASfin = VminSegs; //next move is last
	
	segsReal = moveDist * segRate / Vball; 
	segs = Math.floor(segsReal); 
	
	//deal with tiny moves here:
	if (segs == 0) {
		segs = 1;
		fracSeg = segsReal;
		//console.log('TINY MOVE, frac= '+segsReal)
	}
	else fracSeg=1;
		
	thStepsNew = Math.floor(thNew * thSPRad) * thDirSign; 
	thStepsOld = Math.floor(thOld * thSPRad) * thDirSign; 
	thStepsMove = thStepsNew - thStepsOld;  
	
	rStepsNew = Math.floor(rNew * rSPInch * plotRadius) * rDirSign;
	rStepsOld = Math.floor(rOld * rSPInch * plotRadius) * rDirSign; 
	rStepsMove = rStepsNew - rStepsOld; 
	
	rStepsComp = (Math.floor(thStepsNew * rthAsp) -
										Math.floor(thStepsOld * rthAsp)) * nestedAxisSign;
	rStepsMove += rStepsComp;
  
	
	thStepsSeg = Math.floor(thStepsMove / segs); 
	thLOsteps = thStepsMove - thStepsSeg * segs; //th Left Over steps
	
	rStepsSeg = Math.floor(rStepsMove / segs); 
	rLOsteps = rStepsMove - rStepsSeg * segs; //r Left Over steps
		
	nextSeg(mi,miMax,0,segs, thStepsSeg, rStepsSeg, 
				thLOsteps, rLOsteps, 0, 0, fracSeg);
	
}
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

//////      NEXTSEG     ///////////////////////////////////
function nextSeg(mi, miMax ,si, siMax, thStepsSeg, rStepsSeg, 
								thLOsteps, rLOsteps, eLOth, eLOr, fracSeg) {
	var msec = baseMS;
	var cmd;
	var thLOsign=0, rLOsign=0;
	var thStepsOut, rStepsOut;
	var rSeg, rEffect, rFactor1, rFactor2;
		
	if (si==siMax){
		//console.log('move '+mi+' done, ' + counter + ' segs');
		mi++;
		nextMove(mi,miMax);
		return;
	}
	//ACCEL/DECEL ---------------------------
	if (!pauseRequest){
		//console.log(ASindex);
		if ((ASindex > ASfin) && (ASindex - ASfin > siMax-si)) ASindex--;//decel;
		else {
			if (ASindex < accelSegs) ASindex++; //accel
			if (ASindex > accelSegs) ASindex = accelSegs; //updates Accel changes ?--;?
		}
	}
	else {  //pause requested:
		console.log('decelerating...');
		//console.log(ASindex);
		if (ASindex <= VminSegs) {
			ASindex = VminSegs;
			console.log('PAUSED');
			paused = true;
			pauseRequest = false;
			//record current segment pars:
			Rmi=mi;		RmiMax=miMax;		Rsi=si;		RsiMax=siMax;
			RthStepsSeg=thStepsSeg;		RrStepsSeg=rStepsSeg;
			RthLOsteps=thLOsteps;		RrLOsteps=rLOsteps;
			ReLOth=eLOth;	ReLOr=eLOr;	RfracSeg = fracSeg;	
			
			return; //break the nextSeg chain = being paused
		}
		else ASindex--; //decel on the way to being paused
	}
	//------------------------------------
	if (ASindex < VminSegs) ASindex = VminSegs;
	msec *= Math.sqrt(accelSegs / ASindex);  
	msec /= Voverride; 
	msec *= fracSeg; 
	//------------------------------------
	
	rSeg = (rAccum - thAccum * rthAsp * nestedAxisSign) * rDirSign/ rSPInch;
	RSEG = rSeg;
	console.log('rSeg: ' + Math.floor(rSeg*100)/100);
	if (balls == 1) rEffect = rSeg; //sis
	else rEffect = plotRadius/2 + Math.abs(Radius/2 - rSeg); //tant
	
	if (rEffect > rCrit) { //ball is outside rCrit:
			rFactor1 = Math.sqrt((RDIST * RDIST +
									THRAD * THRAD * rEffect * rEffect)) / MOVEDIST;
			//console.log('rFactor1: ' + rFactor1);
			msec *= rFactor1;
	}
	else { //ball is inside rCrit-- this is shaky at best...
		if (rSeg > RF2MIN) {
			rFactor2 = Math.abs((RDIST / MOVEDIST) * (rCrit / rSeg));
		}
		else {
			rFactor2 = Math.abs((RDIST / MOVEDIST) * (rCrit / RF2MIN));
		}
		//console.log('rFactor2: ' + rFactor2);
		if (rFactor2 < 1) rFactor2 = 1; 
		msec *= rFactor2;
	}
	
	//------------------------------------
	
	thStepsOut = thStepsSeg;
	rStepsOut = rStepsSeg;
	
	if (thLOsteps < 0) thLOsign = -1;	else thLOsign = 1;
	if (rLOsteps < 0) rLOsign = -1;	else rLOsign = 1;
	
	eLOth += Math.abs(thLOsteps);
	eLOr += Math.abs(rLOsteps);
	
	if (eLOth >= siMax) {
		thStepsOut += thLOsign;
		eLOth -= siMax;
	}

	if (eLOr >= siMax) {
		rStepsOut += rLOsign;
		eLOr -= siMax;
	}

	msec = Math.floor(msec);	if (msec < 1) msec = 1;
	cmd = "SM,"+msec+","+thStepsOut+","+rStepsOut+ "\r";
		
	sp.write(cmd, function(err, res) {
				sp.drain(function(err, result){
					if (err) {console.log(err, result);}
					else {	
						console.log (cmd);
						si++;
						//counter++;
						thAccum += thStepsOut;
						rAccum += rStepsOut;
						
						nextSeg(mi, miMax, si, siMax, thStepsSeg, rStepsSeg, 
										thLOsteps, rLOsteps, eLOth, eLOr, 1);
					}
				});											
			});
}		
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

//////      CHECKCONFORMAL    ///////////////////////////////////
function checkConformal() {
	
	console.log('first R in path: ' +  verts[0].r);
	console.log('lastR in path: ' +  verts[verts.length - 1].r);
	
	if  (((Math.abs(verts[0].r - 0) < .01 / plotRadius) || 
		  (Math.abs(verts[0].r  - 1) < .01 / plotRadius))
												&&
			((Math.abs(verts[verts.length - 1].r - 0) < .01 / plotRadius) || 
		  (Math.abs(verts[verts.length - 1].r  - 1) < .01 / plotRadius))){
				
			console.log('path is conformal'); 	
			}
	else {
		console.log('path is NOT conformal, skipping...'); 
		return; // for now
		//nextPath();
	}
	
	RSEG = (rAccum - thAccum * rthAsp * nestedAxisSign) * rDirSign/ rSPInch;
	
	if (Math.abs( verts[0].r * plotRadius - RSEG) > .01) {
				
		console.log('RSEG: ' + RSEG);
		console.log('first R not near RSEG!');
		console.log('reversing path...');
		verts.reverse();
	
		if (Math.abs( verts[0].r * plotRadius - RSEG) > .01) {
			console.log('firstR: ' +  verts[0].r);
		console.log('RSEG: ' + RSEG);
		console.log('first R STILL not near RSEG!');
		console.log('giving up and skipping path');
		//nextPath();
		//return; // for now
		process.exit();
		}
	}
	console.log('path starts at current R, proceeding...')
	
}
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

//////      LOOK AHEAD     ///////////////////////////////////
function lookAhead(mi, heading) {
		var LAthDist, LArDist, inertiaFactor;
	
		LAthDist = (verts[mi+2].th - verts[mi+1].th) * rCrit;
		LArDist = (verts[mi+2].r - verts[mi+1].r) * plotRadius;
		
		//console.log('current heading: '+ heading);
	
		LAheading = Math.atan2(LArDist, LAthDist)
		//console.log('LA heading: '+ LAheading)
		
		dHeading = LAheading - heading;
		dHeading = Math.abs(dHeading);
		
    inertiaFactor = Math.sin(dHeading/2);
		//console.log('inertiaFactor: '+ inertiaFactor);
    ASfin = accelSegs*(1-inertiaFactor);//+1?
		//console.log('ASfin: '+ ASfin);
}
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
////////PLAYLIST file parser--//////////////////////////////////////////
//works but need work -- home entry -> NaN's for v,a,mtv
function loadPlaylist(plistName){
	
	plLinesMax= 0;
	
	var logData = fs.readFileSync(plistName);
  var text = logData.toString();
  var lines = text.split('\n');
			
	lines.forEach(function(line) {
		var parts = line.split(/[ \t]+/); //split on sp's and/or tabs
		//don't know how to assign "new" obj???, so:
		var plistLine = {	name : 'default',
									V : 2,//default Vball
									A : 1,//default ACCEL
									MTV : 0.7// default maxthvel
								}; //plist entry object
		
		
		console.log(parts);
		
		if ((parts[0].charAt(0) != '#') &&
			  (parts[0].charAt(0) != '\r') && 
				(parts[0].charAt(0) != '')) {
					
					plistLine.name = parts[0].trim();
					console.log(plistLine.name);
					plistLine.V = Number(parts[1]);
					plistLine.A = Number(parts[2]);
					plistLine.MTV = Number(parts[3]);
					
					plistLines.push(plistLine);
					plLinesMax++;
				}
  });
	
	console.log('plistLines: ')
	console.log(plistLines);
	console.log(plLinesMax);
 
}


////////ThR file parser--//////////////////////////////////////////
function loadThR(thrName, callback){
	//var fs = require('fs');// 
	 vertMax = 0;

//consider async readFile?	
	var logData = fs.readFileSync(thrName);
  var text = logData.toString();
  var lines = text.split('\n');
		
	lines.forEach(function(line) {
		var parts = line.split(' ');
		var vert = {th : 0, r : 0};
		
		if ((String(Number(parts[0])) != 'NaN') &&
									(String(Number(parts[1])) != 'NaN')){
			vert.th = Number(parts[0]);
			vert.r = Number(parts[1]);
			verts.push(vert);
			vertMax++;
		}
  });
	
	miMax = vertMax-1;
 
	console.log("Loaded "+ thrName+ ": " + vertMax +" vertices");
	callback();
	
}
//------------------------------------------------------------------

////////keyboard listener--//////////////////////////////////////////
stdin.on( 'data', function( key ){
			// ctrl-c ( end of text )
			if ( key === '\u0003' ) {
			process.exit();
			}
			//console.log("key hit: " + key);
  		if (key == 'p')	{
				console.log("pausing requested...");
				if (options.pause) {
					pauseRequest=true;
					return;
				}	
			console.log("pause not an option now");
			}
			if (key == 'g') {
				console.log("go requested...");
				if (options.play) {
					//pauseRequest = false;
					STATUS = 'playing';
					changeOptions(STATUS);
					go();
					return;
				}
				console.log("play not an option now");
			}
			
			if (options.speed) {			
				if (key == '+')	{
					console.log("V+ requested...");
					Voverride *= 1.1;
					console.log("V increased to " + Vball* Voverride);
					return;
				}
				if (key == '-')	{
					console.log("V- requested...");
					Voverride *= .9;
					console.log("V decreased to " + Vball* Voverride);
					return;
				}
				//console.log("speed change not an option now");
			}
			
			if (options.LED) {
				if (key == 'l')	{ //lighter
					console.log("LED+ requested...");
					LED++;
					if (LED > 10) LED = 10;
					console.log("LED increased to " + LED);
					setLED(LED);
					return;
				}
				if (key == 'd')	{ //darker
					console.log("LED- requested...");
					LED--; if (LED < 0) LED = 0;
					console.log("LED decreased to " + LED);
					setLED(LED);
					return;
				}
				//console.log("LED change not an option now");
			}
			
			if (options.jog) { 
				if (key == '\u001B\u005B\u0041') {
					jog('rho','pos');
					//process.stdout.write('up'); 
					return;
				}
				if (key == '\u001B\u005B\u0043') {
					jog('theta','neg');
					//process.stdout.write('right'); 
					return;
				}
				if (key == '\u001B\u005B\u0042') {
					jog('rho','neg');
					//process.stdout.write('down');
					return;
				}
				if (key == '\u001B\u005B\u0044') {
					jog('theta','pos');
					//process.stdout.write('left'); 
					return;
				}
				//console.log("jogging not an option now");
			}	
				
			if (key == 'h') {
				console.log('homing requested');
				if (options.home) { 
					THETA_HOME_COUNTER = 0;
					RHO_HOME_COUNTER = 0;
					STATUS = 'homing';
					changeOptions(STATUS);
					goThetaHome();
					return;				
				}
			console.log("homing not an option now");			
			}
				
});
//-----------------------------------------------------

function go() {
	if (NEWPLIST) {
		console.log("Starting new plist...");
		paused = false;//?
		NEWPLIST = false;
		nextPlaylistLine(0, plLinesMax)
		
	}	
	else {
	paused=false;
	console.log("resuming...");
	nextSeg(Rmi, RmiMax, Rsi, RsiMax, RthStepsSeg, RrStepsSeg,
												RthLOsteps, RrLOsteps, ReLOth, ReLOr, RfracSeg);
	}
}

//////      GO THETA HOME    ///////////////////////////////////
function goThetaHome() {
	var thetaHomingStr, thetaHomeQueryStr = "PI,B,7\r";
	//Theta home pin B7 sbb1, D2 sbb1.1, (C0 ebb)//R home pin C6
	
	if (pauseRequest) {
		pauseRequest = false;
		STATUS = 'waiting';
		changeOptions(STATUS);
		console.log('theta homing aborted');
		return;
	}

		if (THETA_HOME_COUNTER == THETA_HOME_MAX) {
		console.log('Failed to find Theta home!');
		//handle error condition
		STATUS = 'waiting';
		changeOptions(STATUS);
		return;
	}
	
	if (THETA_HOMED) {
		if (RETESTCOUNTER < RETESTNUM) {
			sp.write(thetaHomeQueryStr); //check inputs again
			WAITING_THETA_HOMED = true;
			RETESTCOUNTER++;
			console.log("RETESTCOUNTER: " + RETESTCOUNTER);
			return;
		}
		//passed restesting so truly home:
		thAccum = 0;
		THETA_HOME_COUNTER = 0;
		console.log('THETA AT HOME!');
		RETESTCOUNTER = 0;
		WAITING_THETA_HOMED = false;
		goRhoHome();
		
		return;
	}
	// not at theta home yet, so:
	sp.write(thetaHomeQueryStr); //EBB inputs query command
		
	rCompSteps = Math.round(HOMETHSTEPS * rthAsp * nestedAxisSign) * thDirSign;
	thetaHomingStr = "SM,"+ baseMS + "," + HOMETHSTEPS * thDirSign+ "," + rCompSteps + "\r";
	sp.write(thetaHomingStr);
	WAITING_THETA_HOMED = true;
	console.log('homing theta...');
	THETA_HOME_COUNTER++;
					
	}	
		
	//////      GO RHO HOME    ///////////////////////////////////
function goRhoHome() {
	var rhoHomingStr, rhoHomeQueryStr = "PI,C,6\r";
	// R home pin C6
	
	if (pauseRequest) {
		pauseRequest = false;
		STATUS = 'waiting';
		changeOptions(STATUS);
		console.log('r homing aborted');
		return;
	}
			
	if (RHO_HOME_COUNTER == RHO_HOME_MAX) {
		console.log('Failed to find Rho home!');
		//handle error condition
		STATUS = 'waiting';
		changeOptions(STATUS);
		return;
	}
	
	if (RHO_HOMED) {
		if (RETESTCOUNTER < RETESTNUM) {
			sp.write(rhoHomeQueryStr); //check inputs again
			WAITING_RHO_HOMED = true;
			RETESTCOUNTER++;
			console.log("RETESTCOUNTER: " + RETESTCOUNTER);
			return;
		}
		
		rAccum = 0;
		RHO_HOME_COUNTER = 0;
		console.log('RHO AT HOME!');
		RETESTCOUNTER = 0;
		WAITING_RHO_HOMED = false;
		
		STATUS = 'waiting'; 
		changeOptions(STATUS);
		
		if (PLHOMED) {
			STATUS = 'playing'; 
			changeOptions(STATUS);
			PLINDEX++;
			nextPlaylistLine(PLINDEX, plLinesMax);
		}
		return;
	}
	// not at rho home yet, so:
	sp.write(rhoHomeQueryStr); //EBB inputs query command
		
	rhoHomingStr = "SM,"+ baseMS + "," + 0 + "," + -HOMERSTEPS * rDirSign + "\r";
	sp.write(rhoHomingStr);
	WAITING_RHO_HOMED = true;
	console.log('homing rho...');
	RHO_HOME_COUNTER++;
					
	}					


//////      JOG     ///////////////////////////////////
function jog(axis, direction) {
	var jogThsteps = 0, jogRsteps = 0;
	
	if (axis == "theta"){
		if (direction == 'pos') jogThsteps = JOGTHSTEPS * thDirSign;
		else jogThsteps = JOGTHSTEPS * -thDirSign ;
		
		jogRsteps = Math.round(jogThsteps * rthAsp * nestedAxisSign) * thDirSign;
	}	
			
	if (axis == "rho"){
		if (direction == 'pos') jogRsteps = JOGRSTEPS * rDirSign;
		else jogRsteps = JOGRSTEPS * -rDirSign;
	}			
	
	sp.write("SM,"+baseMS+","+jogThsteps+","+jogRsteps+ "\r");
	
}
//-----------------------------------------------------

////////Serial Port stuff--//////////////////////////////////////////
sp.on('open', showPortOpen);
sp.on('data', parseReceivedSerialData);
sp.on('close', showPortClose);
sp.on('error', showError);

function showPortOpen() {
   console.log('serialport open.  ');
	 sp.write('CU,1,0\r'); // turn off EBB sending "OK"s
	 setLED(LED);
	 
	 loadPlaylist('test.pl');
	 
	 console.log('hit G to start');
}

function parseReceivedSerialData(data) {
	var parts;
		
	console.log("received: " + data);
	parts = String(data).split(',');
	
	if (parts[0] == '!') console.log("EBB error: " + data);
	if (true/*parts[0] == 'PI'*/) { //can't trust rec'd data will be ungarbled.
		if (WAITING_THETA_HOMED) {
			if (Number(parts[1]))	{
				THETA_HOMED = false;
				RETESTCOUNTER = 0;
			}
			else THETA_HOMED = true;
			
			goThetaHome();
			return;
		}
		
		if (WAITING_RHO_HOMED) {
			if (Number(parts[1]))	{
				RHO_HOMED = false;
				RETESTCOUNTER = 0;
			}
			else RHO_HOMED = true;
			
			goRhoHome();
			return;
		}
	}	
}


function setLED(setting) {
	//var pwmNum = 0, setting;
	var setLEDstr = "SE,1,";
	
	console.log(setting);
	
	if (setting == 0) sp.write("SE,0\r");
	else {
	setLEDstr += String(Math.pow(2, setting) -1);
	setLEDstr += "\r";
	
	console.log(setLEDstr);
	sp.write(setLEDstr);
	}
}



function showPortClose() {
   console.log('port closed.');
}

function showError(error) {
   console.log('Serial port error: ' + error);
}

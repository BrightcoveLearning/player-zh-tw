videojs.plugin('customEventPlugin', function() {
	
  // Create variables and new div and image for back button
  var myPlayer = this;
    
  // listen for a custom event with data
  myPlayer.on('rewind',function(evt,data){
	  console.log("custom event ", evt);
	  console.log("custom event data ", data);

	  var newTime,
	      videoTime = myPlayer.currentTime(),
		  rewindAmt = data.amount;
	  
	  console.log("rewindAmt ", rewindAmt);
	  
	  if (videoTime >= rewindAmt) {
		  newTime = videoTime - rewindAmt;
	  } else {
		  newTime = 0;
	  }

	  myPlayer.currentTime(newTime);
  });
});
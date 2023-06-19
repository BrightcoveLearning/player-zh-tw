<script type="text/javascript">
  videojs("video_1").ready(function() {
      // Create variables and new div and image elements for rewind icon
      var myPlayer = this,
          videoName,
    rewindAmount = 5,
          controlBar,
    newElement = document.createElement('div'),
    newImage = document.createElement('img');

      // Assign id to div for icon
      newElement.id = 'backButton';

      // Assign property to element and assign to parent
      newImage.setAttribute('src','http://solutions.brightcove.com/bcls/brightcove-player/custom-event/back-button.png');
      newElement.appendChild(newImage);

      // Get the spacer element
      spacer = document.getElementsByClassName('vjs-spacer')[0];
      // Place the new element in the spacer
      spacer.appendChild(newElement);

      backButton = document.getElementById("backButton");

      backButton.onclick = function() {
    // trigger a custom event with data
          myPlayer.trigger('rewind', {'amount': rewindAmount});
      }

      // listen for a custom event with data
      myPlayer.on('rewind',function(evt,data){

    var newTime,
        rewindAmt = data.amount,
        videoTime = myPlayer.currentTime();

    if (videoTime >= rewindAmt) {
        newTime = videoTime - rewindAmt;
    } else {
        newTime = 0;
    }

    myPlayer.currentTime(newTime);
      });
  });
</script>

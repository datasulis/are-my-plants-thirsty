Thirsty = {

  //return name of current month
  //FIXME
  month_name: function() {
    monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return monthNames[new Date().getMonth()];
  },

  //return first day of this month
  //FIXME
  month_start: function() {
    return "2015-08-01T00:00:00";
  },

  //return date 3 days ago to look for recent rainfall
  //FIXME
  recent: function() {
    return "2015-08-04T00:00:00";
  },

  //return yesterdays date
  //FIXME
  yesterday: function() {
    return "2015-08-06T00:00:00";
  },

  //fetch total rainfall for last few days
  recent_rainfall: function() {
    return $.ajax({
      url: "https://data.bathhacked.org/resource/y3sn-855n.json",
      data: {
        '$where': 'time >= "' + Thirsty.recent() + '"',
        '$select': 'sum(precip_ratem)'
      },
      dataType: 'json'
    });

  },  

  //fetch expected rainfall for the specified month
  monthly_rainfall: function() {
    return $.ajax({
      url: "https://data.bathhacked.org/resource/iygs-iq2b.json",
      data: {
        'month': Thirsty.month_name
      },
      dataType: 'json'
    });
  },

  //fetch the total rainfall for a given day
  //uses the total in the dataset rather than calculating
  rainfall: function() {

    return $.ajax({
      url: "https://data.bathhacked.org/resource/y3sn-855n.json",
      data: {
        '$where': 'time >= "' + Thirsty.yesterday() + '"',
        '$order': 'time DESC',
        '$limit': 1
      },
      dataType: 'json'
    });

  }

};


$(document).ready(function(){

  $.when(   
    Thirsty.rainfall(),
    Thirsty.recent_rainfall(),
    Thirsty.monthly_rainfall() ).done( function( rainfall, recent, monthly ) {
      //Each argument is an array with the following structure: [ data, statusText, jqXHR ]
      //then socrata returns an array of objects

      //yesterdays rainfall
      yesterday = rainfall[0][0]["precip_totalm"];
      //rain fall in last 3 days
      recent_rainfall = recent[0][0]["sum_precip_ratem"];

      //climate history, rainfall, number of days of rain expected
      monthly_rainfall = monthly[0][0]["rainfall_mm"];
      monthly_days = monthly[0][0]["days_of_rainfall_1_mm_days"];
      //when it does rain, how much can we expect
      monthly_average = monthly_rainfall / monthly_days;

      //decisions: unlikely, probably, definitely
      if (recent_rainfall == 0) {
        $("#result").text("DEFINITELY");
        $("#result-image").attr("src", "water.png");
        $("#comments").html("<p>It hasn't rained in the last 3 days, best give them a drop.</p>");
      }
      if ( recent_rainfall > monthly_average ) {
        $("#result").text("UNLIKELY");
        $("#result-image").attr("src", "ok.png");
        $("#comments").html("<p>They should be fine, its rained more than average recently.</p>");
        $("#comments").append("<p class='lead'>It's rained <strong>" + recent_rainfall + "mm</strong> in the last 3 days, <strong>" + yesterday + "mm</strong> fell yesterday</p>");
      }    
      if ( (recent_rainfall/3) < monthly_average ) {
        $("#result").text("PROBABLY");
        $("#result-image").attr("src", "check.png");
        $("#comments").html("<p>It's been dry. They might need a drink. Best check your pots.</p>");
        $("#comments").append("<p class='lead'>It's rained <strong>" + recent_rainfall + "mm</strong> in the last 3 days, <strong>" + yesterday + "mm</strong> fell yesterday</p>");
      } 

      $("#comments").append("<p class='lead'>Based on our climate we can expect <strong>" + monthly_rainfall + "mm</strong> of rain this month. That's around <strong>" + monthly_average.toFixed(2) + "mm</strong> on days that it does rain.</p>");
  });

});

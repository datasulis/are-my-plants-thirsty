Thirsty = {

  //return name of current month
  month_name: function() {
    monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return monthNames[new Date().getMonth()];
  },

  //return first day of this month
  month_start: function() {
    return moment().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
  },

  //return date 3 days ago to look for recent rainfall
  recent: function() {
    return moment().subtract(3, 'days').startOf('day').format('YYYY-MM-DDTHH:mm:ss')
  },

  today: function() {
    return moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
  },

  //return yesterdays date
  yesterday: function() {
    return moment().subtract(1, 'days').startOf('day').format('YYYY-MM-DDTHH:mm:ss');
  },

  //CLIMATE DATASET
  //fetch expected rainfall for the current month
  monthly_rainfall: function() {
    return $.ajax({
      url: "https://data.bathhacked.org/resource/iygs-iq2b.json",
      data: {
        'month': Thirsty.month_name
      },
      dataType: 'json'
    });
  },

  //WEATHER DATA
  //fetch daily total rainfall for last few days
  //we look for the maximum value for each day as it looks like the rain gauge
  //can be reset before the end of the day
  recent_rainfall: function() {
    return $.ajax({
      url: "https://data.bathhacked.org/resource/xdby-kbhf.json",
      data: {
        '$where': "time > '" + Thirsty.recent() + "' and time < '" + Thirsty.today() + "'",
        '$select': 'date_trunc_ymd(time) as day, max(precip_totalm)',
        '$group': 'day',
        '$order': 'day DESC'
        
      },
      dataType: 'json'
    });

  },  

};


$(document).ready(function(){

  $.when(   
    Thirsty.recent_rainfall(),
    Thirsty.monthly_rainfall() ).done( function( recent, monthly ) {

      //Each argument is an array with the following structure: [ data, statusText, jqXHR ]
      //then socrata returns an array of objects
      if (recent[2].status == 200 && monthly[2].status == 200) {

        //yesterdays rainfall
        yesterday = recent[0][0]["max_precip_totalm"];

        //sum recent rainfall, count number of days of rain
        recent_rainfall = 0;
        $.each( recent[0], function() { recent_rainfall += parseInt(this["max_precip_totalm"]) || 0; });
        days_of_rain = 0;
        $.each( recent[0], function() { if ( parseInt(this["max_precip_totalm"]) > 0) { days_of_rain += 1 } });

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
        if ( (recent_rainfall / 3) > monthly_average ) {
          $("#result").text("UNLIKELY");
          $("#result-image").attr("src", "ok.png");
          $("#comments").html("<p>They should be fine, its rained more than average recently.</p>");
          $("#comments").append("<p class='lead'>It's rained <strong>" + recent_rainfall + "mm</strong> in the last 3 days, <strong>" + yesterday + "mm</strong> fell yesterday</p>");
        }    
        if ( (recent_rainfall / 3) < monthly_average ) {
          $("#result").text("PROBABLY");
          $("#result-image").attr("src", "check.png");
          $("#comments").html("<p>It's been dry. They might need a drink. Best check your pots.</p>");
          $("#comments").append("<p class='lead'>It's rained <strong>" + recent_rainfall + "mm</strong> in the last 3 days, <strong>" + yesterday + "mm</strong> fell yesterday</p>");
        } 

        $("#comments").append("<p class='lead'>Based on our climate we can expect <strong>" + monthly_rainfall + "mm</strong> of rain this month. That's around <strong>" + monthly_average.toFixed(2) + "mm</strong> on days that it does rain.</p>");

      } else {
         $("#result").text("Sorry");
         $("#comments").html("<p>The weather data is unavailable</p><p>Best check the plants manually</p>");
      }
  });

});

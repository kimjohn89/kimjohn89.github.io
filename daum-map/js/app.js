$("#search-btn").click(function(){
    var daumMap = new DaumMap();
    daumMap.init($('#startLoc__Input').val());
});


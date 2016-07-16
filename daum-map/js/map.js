var PlaceInfo = function(name, zipcode, address){
    this.name = name;
    this.zipcode = zipcode;
    this.address = address;
};

var DaumMap = function(){
    this.map;
    this.places;
    this.placeMap = new Map();
};


DaumMap.prototype = {
    init: function(startLocation){
        var self = this;
        var container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
        var options = { //지도를 생성할 때 필요한 기본 옵션
            center: new daum.maps.LatLng(33.450701, 126.570667),
            level: 5 //지도의 레벨(확대, 축소 정도)
        };
        self.map = new daum.maps.Map(container, options); //지도 생성 및 객체 리턴

        self.places = new daum.maps.services.Places();
        self.places.keywordSearch(startLocation, function(status, result){
            self.showInitSelectWindow(result);
        });

        daum.maps.event.addListener(self.map, 'click', function(event){
            var latlng = event.latLng;
            /*
            var message = '클릭한 위치의 위도는 ' + latlng.getLat() + ' 이고, ';
            message += '경도는 ' + latlng.getLng() + ' 입니다';
            console.log(message);
            */
            self.nearbySearch(latlng);
        });

    },
    showInitSelectWindow: function(result){
        var self = this;
        $('#selectList').empty();
        $('.selectWindow').css('display','block');
        var selectList = $('#selectList');
        for(var place of result.places){
            selectList.append('<li><a href="#" id="'+place.id+'">'+place.title+'</a>: '+place.address+'</li>');
            $('#'+place.id).click(
                (function(clickedPlace){
                    return function(){
                        self.map.setCenter(new daum.maps.LatLng(clickedPlace.latitude, clickedPlace.longitude));
                        $('.selectWindow').css('display','none');
                        $('.startLoc').css('display','none');
                    }
                })(place)
            );
        }
    },
    addToSelectWindow: function(result,selectList) {
        var self = this;
        for(var place of result.places){
            selectList.append('<li><a href="#" id="' + place.id + '">' + place.title + '</a>: ' + place.address + '</li>');
            $('#' + place.id).click(
                (function(clickedPlace) {
                    return function(){
                        var placeInfo = new PlaceInfo(clickedPlace.title, clickedPlace.zipcode, clickedPlace.newAddress);
                        self.placeMap.set(clickedPlace.id, placeInfo);

                        var location = new daum.maps.LatLng(clickedPlace.latitude, clickedPlace.longitude);
                        self.map.setCenter(location);
                        self.addMarker(location, clickedPlace.id);
                        $('.selectWindow').css('display', 'none');
                        self.showRoadView(location, clickedPlace.id);
                    }
                })(place)
            );
        }
    },
    nearbySearch: function(location){
        var self = this;
        var searchLoc = new daum.maps.LatLng(location.getLat(), location.getLng());
        // Daum은 카타고리 검색이 별로. 카타고리 지정없이는 검색할 수 없으며, 여러개 카타고리를 동시에 검색도 하지 못함
        var categories = ["SC4","FD6"];
        //["MT1","CS2","PS3","SC4","AC5","PK6","OL7","SW8","BK9","CT1","AG2","PO3","AT4","AD5","FD6","CE7","HP8","PM9"];
        var categoryTitles = ["학교","음식점"];
            //["대형마트","편의점","유치원","학교","학원","주차장","주유소","지하철역","은행",
            //"문화시설","중개업소","공공기관","관광명소","숙박","음식점","카폐","병원","약국"];
        var content = $('.selectWindowContent');
        content.empty();
        $('.selectWindow').css('display','block');

        for(var i = 0; i<categories.length; i++){
            self.places.categorySearch(categories[i],
                (function(index){
                    return function(status, result, pagination) {
                        if (status === daum.maps.services.Status.OK) {
                            var newDiv = $('<div></div>');
                            content.append(newDiv);
                            newDiv.append('<h3>'+categoryTitles[index]+'</h3>');
                            var newList = $('<ul></ul>');
                            newDiv.append(newList);
                            self.addToSelectWindow(result,newList);
                        }
                        /*
                        else if (status === daum.maps.services.Status.ZERO_RESULT) {
                            // 검색결과가 없는경우 해야할 처리가 있다면 이곳에 작성해 주세요
                            console.log(categories[index]+": 없어");

                        }
                        else if (status === daum.maps.services.Status.ERROR) {
                            // 에러로 인해 검색결과가 나오지 않은 경우 해야할 처리가 있다면 이곳에 작성해 주세요
                            console.log(categories[index]+": 오류");
                        }
                        */
                    }
                })(i),
                {
                    location: searchLoc,
                    radius: 200
                }
            );
        }
    },
    addMarker: function(location, place_id) {
        var self = this;
        var marker = new daum.maps.Marker({
            map: self.map,
            position: location,
        });
        marker.setMap(self.map);

        var placeInfo = self.placeMap.get(place_id);

        var popup = $('<div class="markerWindow"></div>');
        popup.append('<h3>'+placeInfo.name+' <a id="rv'+place_id+
            '" href="#"><img src="image/roadview.jpg" height="24"></a></h3>');
        var infoList = $('<ul></ul>');
        popup.append(infoList);
        infoList.append('<li>주소: ('+placeInfo.zipcode+') '+placeInfo.address+'</li>');

        var infowindow = new daum.maps.InfoWindow({
            position: location,
            content: popup[0],
            removable: true
        });
        daum.maps.event.addListener(marker, 'click', function() {
            // 마커 위에 인포윈도우를 표시합니다
            infowindow.open(self.map, marker);
        });
    },
    showRoadView: function(location, place_id) {
        console.log("I am here");
        var self = this;
        //self.map.addOverlayMapTypeId(daum.maps.MapTypeId.ROADVIEW); //지도 위에 로드뷰 도로 올리기
        var rvContainer = document.getElementById('pano'); //로드뷰를 표시할 div
        var rv = new daum.maps.Roadview(rvContainer); //로드뷰 객체
        var rvClient = new daum.maps.RoadviewClient(); //좌표로부터 로드뷰 파노ID를 가져올 로드뷰 helper객체
        rvClient.getNearestPanoId(location, 50, function(panoId) {
            if (panoId === null) {
                $('.panoDiv').css('display','none');
            } else {
                $('.panoDiv').css('display','block');
                rv.setPanoId(panoId, location); //panoId를 통한 로드뷰 실행
                //rv.relayout(); //로드뷰를 감싸고 있는 영역이 변경됨에 따라, 로드뷰를 재배열합니다
            }
        });
    }
};


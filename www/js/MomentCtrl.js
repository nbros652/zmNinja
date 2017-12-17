/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry */


//https:///zm/api/events/index/AlarmFrames%20%3E=:1/StartTime%20%3E=:2017-12-16%2009:08:50.json?sort=TotScore&direction=desc

angular.module('zmApp.controllers').controller('zmApp.MomentCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVRDataModel', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$translate', '$q', '$templateRequest', '$sce', '$compile', '$http', '$ionicLoading', 'zm', '$timeout', '$q', '$ionicPopover','$ionicPopup','message', function($scope, $rootScope, $ionicModal, NVRDataModel, $ionicSideMenuDelegate, $ionicHistory, $state, $translate, $q, $templateRequest, $sce, $compile, $http, $ionicLoading,zm, $timeout, $q, $ionicPopover, $ionicPopup, message)
{

    var timeFrom;
    var timeTo;
    var moments = [];
    var monitors = [];

    $scope.openMenu = function()
    {
        $ionicSideMenuDelegate.toggleLeft();
    };

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions(
            {
                disableBack: true
            });
            $state.go("app.events",
            {
                "id": 0,
                "playEvent": false
            },
            {
                reload: true
            });
            return;
        }
    };

    // credit https://stackoverflow.com/a/17265125/1361529
    function objSort() {
        var args = arguments,
            array = args[0],
            case_sensitive, keys_length, key, desc, a, b, i;
    
        if (typeof arguments[arguments.length - 1] === 'boolean') {
            case_sensitive = arguments[arguments.length - 1];
            keys_length = arguments.length - 1;
        } else {
            case_sensitive = false;
            keys_length = arguments.length;
        }
    
        return array.sort(function (obj1, obj2) {

           // console.log ("obj1="+JSON.stringify(obj1));
          //  console.log ("obj2="+JSON.stringify(obj2));
            for (i = 1; i < keys_length; i++) {
                key = args[i];
                if (typeof key !== 'string') {
                   // console.log ("ARGS I 0"+args[i][0]);
                    desc = key[1];
                    key = key[0];
                    a = obj1["Event"][args[i][0]];
                    b = obj2["Event"][args[i][0]];
                } else {
                    desc = false;
                    a = obj1["Event"][args[i]];
                    b = obj2["Event"][args[i]];
                }
               // console.log ("a="+a);
              //  console.log ("b="+b);

                if (case_sensitive === false && typeof a === 'string') {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                }
    
                if (! desc) {
                    if (a < b) return -1;
                    if (a > b) return 1;
                } else {
                    if (a > b) return -1;
                    if (a < b) return 1;
                }
            }
            return 0;
        });
    } //end of objSort() function

    function getMonitorDimensions(mid) {

        for (var i=0; i < monitors.length; i++) {
           
            if (mid==monitors[i].Monitor.Id) {
                return {
                    width: monitors[i].Monitor.Width,
                    height:monitors[i].Monitor.Height,
                    orientation:monitors[i].Monitor.Orientation
                }
            }
        }

    }


    $scope.reLayout = function () {
        NVRDataModel.log ("relaying masonry");
        $timeout (function () {masonry.layout();},300);
        
    };

    $scope.toggleCollapse = function(mid,eid) {
        NVRDataModel.debug ("toggling collapse for:"+mid);
        var collapseCount=0; collapseId=0;
        for (var i=0; i < $scope.moments.length; i++) {
            if ($scope.moments[i].Event.Id == eid ) {
            
                    $scope.moments[i].Event.hide = false;
                    collapseId = i;

                    $scope.moments[i].Event.icon = $scope.moments[i].Event.icon == "ion-code-working" ? "ion-images" :"ion-code-working"  ;


                    

                }
                else  if ($scope.moments[i].Event.MonitorId == mid ) {
                    // same monitor, but different ID
                    
                    $scope.moments[i].Event.hide = !$scope.moments[i].Event.hide ;
                    if ($scope.moments[i].Event.hide) collapseCount++;
                    //console.log ("Hiding " + i);
                }
            } //for
            if (collapseCount) {
                $scope.moments[collapseId].Event.collapseCount = collapseCount
            } else {
                $scope.moments[collapseId].Event.collapseCount="";
            }

            
        
        $timeout ( function () {
            masonry.reloadItems();
          
        },100);

        masonry.once( 'layoutComplete', function( laidOutItems ) {
            $timeout ( function () {masonry.layout();},300);
        }  )

        $timeout ( function () {masonry.layout();},300);

    };


    $scope.hourmin = function(str) {
        return moment(str).format(NVRDataModel.getTimeFormat());

    };

    function humanizeTime(str)
    {
        //console.log ("Time:"+str+" TO LOCAL " + moment(str).local().toString());
        //if (NVRDataModel.getLogin().useLocalTimeZone)
        return moment.tz(str, NVRDataModel.getTimeZoneNow()).fromNow();
        // else    
        //  return moment(str).fromNow();

    }

    function initMasonry()
    {
        $ionicLoading.show(
        {
            template: $translate.instant('kArrangingImages'),
            noBackdrop: true,
            duration: zm.loadingTimeout
        });
        var progressCalled = false;

        var ld = NVRDataModel.getLogin();

        var elem = angular.element(document.getElementById("mygrid"));
        masonry = new Masonry('.grid',
        {
            itemSelector: '.grid-item',
            percentPosition: true,
            columnWidth: '.grid-sizer',
            horizontalOrder: true,
            gutter: 2,
            initLayout: true

        });
        //console.log ("**** mygrid is " + JSON.stringify(elem));
        imagesLoaded(elem).on('progress', function(instance, img)
        {
            masonry.layout();
           
        });
        imagesLoaded(elem).once('always', function()
        {
        
            NVRDataModel.debug("All images loaded");
            $ionicLoading.hide();

            $timeout (function() {masonry.layout();},300);

            if (!progressCalled)
            {
                NVRDataModel.log("***  PROGRESS WAS NOT CALLED");
                masonry.reloadItems();
            }

        });
    }

    $scope.closeModal = function()
    {
        NVRDataModel.debug(">>>MomentCtrl:Close & Destroy Modal");
        NVRDataModel.setAwake(false);
        if ($scope.modal !== undefined)
        {
            $scope.modal.remove();
        }

    };

    $scope.showThumbnail = function (b,f) {

        if (!f)  {// api update needed

            $ionicPopup.alert(
                {
                    title: $translate.instant('kNote'),
                    template: "{{'kApiUpgrade' | translate }}",
                    okText: $translate.instant('kButtonOk'),
                    cancelText: $translate.instant('kButtonCancel'),
                });
                return;

        }

        $scope.thumbnailLarge=b+'/index.php?view=image&fid='+f;
        $ionicModal.fromTemplateUrl('templates/image-modal.html',
        {
            scope: $scope,
            animation: 'slide-in-up',
            id: 'thumbnail',
        })
        .then(function(modal)
        {
            $scope.modal = modal;
            

            $scope.modal.show();

            var ld = NVRDataModel.getLogin();

        });        

    };

    $scope.getMoments = function (cond) {
        getMoments (cond);
    }

    function getMoments(sortCondition) {

        if (sortCondition == 'MaxScore')
            $scope.type = $translate.instant('kMomentMenuByScore');
        else if (sortCondition == 'StartTime')
            $scope.type = $translate.instant('kMomentMenuByTime');
            else if (sortCondition == 'MonitorId')
            $scope.type = $translate.instant('kMomentMenuByMonitor');

        $scope.apiurl = NVRDataModel.getLogin().apiurl;
        moments.length = 0;
        
        NVRDataModel.setAwake(false);
        var tmptimeto = moment();
        var tmptimefrom = tmptimeto.subtract(24, 'hours');
        var page = 1;
        timeFrom = tmptimefrom.format('YYYY-MM-DD HH:mm:ss');
        timeTo = tmptimeto.format('YYYY-MM-DD HH:mm:ss');

        NVRDataModel.debug ("Moments from "+timeFrom+" to "+timeTo);

        //https:///zm/api/events/index/AlarmFrames%20%3E=:1/StartTime%20%3E=:2017-12-16%2009:08:50.json?sort=TotScore&direction=desc

        var ld = NVRDataModel.getLogin();

        // in API, always sort by StartTime so all monitors are represented
        var myurl = ld.apiurl + "/events/index/AlarmFrames >=:1/StartTime >=:"+timeFrom+".json?sort="+"StartTime"+"&direction=desc";
        NVRDataModel.debug ("Retrieving "+ myurl);
       
        $http.get(myurl+'&page='+page)
        .then (function (rawdata) {

            
           // console.log (JSON.stringify(data));
            var data = rawdata.data;
            console.log ("--------> PAGES=" + data.pagination.pageCount);
           for (var i=0; i < data.events.length; i++) {
              // console.log ("pushing "+ JSON.stringify(data.data.events[i]));

              var d = getMonitorDimensions(data.events[i].Event.MonitorId);
              if (d) {
                data.events[i].Event.width = d.width;
                data.events[i].Event.height= d.height;


                var ratio;
                var mw = d.width;
                var mh = d.height;
                var mo = d.orientation;

                // scale by X if width > height                                
                if (mw > mh ) {
                    ratio = mw / zm.thumbWidth;
                    data.events[i].Event.thumbWidth = 200;
                    data.events[i].Event.thumbHeight = Math.round(mh/ratio);
                }
                else {

                    ratio = mh / zm.thumbWidth;
                    data.events[i].Event.thumbHeight = 200;
                    data.events[i].Event.thumbWidth = Math.round(mw/ratio);

                }
                if (mo != 0) {

                    /*myevents[i].Event.Rotation = {
                        'transform' : 'rotate('+mo+'deg'+')'
                    };   */

                    var tmp = data.events[i].Event.thumbHeight;
                    data.events[i].Event.thumbHeight =data.events[i].Event.thumbWidth;
                    data.events[i].Event.thumbWidth = tmp;
                    
                } // swap 

                //console.log (d.width+"*"+d.height);

              }
              
               data.events[i].Event.hide = false; 
               data.events[i].Event.icon = "ion-code-working"; 
               data.events[i].Event.baseURL = NVRDataModel.getBaseURL(data.events[i].Event.MonitorId);
               data.events[i].Event.monitorName = NVRDataModel.getMonitorName(data.events[i].Event.MonitorId);

               data.events[i].Event.dateObject = new Date(data.events[i].Event.StartTime);
               
               data.events[i].Event.humanizeTime = humanizeTime(data.events[i].Event.StartTime);

               var mid = data.events[i].Event.MonitorId;
               data.events[i].Event.order = i;


              // console.log ("---> PUSHING "+data.events[i].Event.StartTime);
               moments.push (data.events[i]);
           }

           // not really sure we need this
           // will see later
           if (sortCondition == "StartTime") {
                moments.sort(function(a, b) {
                    var da = a.Event.dateObject;
                    var db = b.Event.dateObject;
                    return da>db ? -1 : da<db ? 1 : 0;
                });
           }

           // if we use any other condition, we need to first sort by cond and then time
           if (sortCondition != "StartTime") {
               console.log ("SORTING BY "+sortCondition);
            moments = objSort(moments,[sortCondition, true],["dateObject", true]);
           }


          /* if (sortCondition == "MonitorId") {
            moments.sort(function(a, b) {
                var da = a.Event.MonitorId;
                var db = b.Event.MonitorId;
                return da>db ? -1 : da<db ? 1 : 0;
            });
       }*/


           

           $scope.moments = moments;

           $timeout (function() {initMasonry();},300 );
           

        },
        function (err) {
            console.log ("ERROR=" + JSON.stringify(err));
            NVRDataModel.displayBanner('error',[translate.instant('kMomentLoadError')]);

        });
       



    };

    $scope.$on('$ionicView.beforeLeave', function()
    {
        NVRDataModel.debug ("Destroying masonry");
        masonry.destroy();
    });

   
    $scope.$on('$ionicView.afterEnter', function()
    {

     
        monitors = message;
        $ionicPopover.fromTemplateUrl('templates/moment-popover.html',
        {
            scope: $scope,
        }).then(function(popover)
        {
            $scope.popover = popover;
        });

        getMoments("StartTime");
        
        //getMoments ("MaxScore");
    

    });

}]);
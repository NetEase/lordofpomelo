var result = '1';
monitor.sysmonitor.getSysInfo(function(msg){
   result = msg;
});
result;

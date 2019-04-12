(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

window.gaInit = function (apiKey) {
    ga('create', apiKey, 'auto');
};

window.gaPushEvent = function (name, params) {
    params = params || {};
    var action = params.platform + '.' + params.userType;
    delete params.platform;
    delete params.userType;
    var label = JSON.stringify(params);
    ga('send', 'event', name, action, label);
};
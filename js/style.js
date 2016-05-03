"use strict";

var $wrapW = $('#wrapper').width(),
    $mbBodyH = $('#mainBody').height();


// Left bar active/hidden settings
function LeftBarVis(){
    
    if (window.matchMedia('(max-width: 420px), (max-width: 736px) and (max-height: 420px)').matches) {
        $('#mBLeftBar').css('display', 'none');
        $('#mBBody').css('width', $wrapW).css('text-align', 'center');
    } else if ($('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-wallet' || $('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-history' || $('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-community') {
            $('#mBLeftBar').css('display', 'none');
            $('#mBBody').css('width', $wrapW);
            $('#mBB-wallet').css('text-align', 'center');
    } else {
            $('#mBLeftBar').css('display', 'table-cell');    
    } 

};


// GUI elements dynamic sizing and LeftBar visibility
$(window).on("load resize", function(e){
    
	var $wrapH = $('#wrapper').height(),
        $headerH = $('header').height(),
        $tabsH = $('#tabs').height(),
        $mainBodyH = $wrapH - $headerH - $tabsH,
		$lb = $('#mBLeftBar'),
        $lbW = $('#mBLeftBar').width(),
		$mbBodyW = $wrapW - $lbW;
    
	$('#mainBody').css('height', $mainBodyH);
	$('#mBLeftBar').css('height', $mainBodyH);
	$('#mBBody').css('width', $mbBodyW);
    
    LeftBarVis();
    
});

// Left bar active/hidden settings on tab clicks
$('input[type=radio]').click(function(){ LeftBarVis(); });


// Fee styling on .paymentForm
$(window).ready(function(){
   $(".paymentForm tr td:contains('Fee')").each(function(){
       $(this).parent().addClass( "paymentFormFee" );
   }); 
});

// Temporary - Delete later
$('#mBB-community').height($mbBodyH);

/* FOR LATER REFINEMENT-
 if ($('input[type=radio][name=tabs-Icons]').val() == 'mBB-wallet' && (window.matchMedia('(max-width: 1024px)')).matches) { };
*/
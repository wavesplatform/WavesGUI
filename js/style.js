/******************************************************************************
 * Copyright © 2016 The Waves Core Developers.                                *
 *                                                                            *
 * See the LICENSE.txt files at                                               *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE.txt  *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/


"use strict";

var $wrapW = $('#wrapper').width(),
    $mbBodyH = $('#mainBody').height();


// Left bar active/hidden settings
// COMMENTED OUT FOR NOW - MIGHT UNCOMMENT AFTER ALPHA OR SUBSTITUTE ENTIRELY
//function LeftBarVis(){
//    
//    if (window.matchMedia('(max-width: 420px), (max-width: 736px) and (max-height: 420px)').matches) {
//        
//        $('#mBLeftBar').css('display', 'none');
//        $('#mBBody').css('width', $wrapW).css('text-align', 'center');
//        
//    } else if ($('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-wallet' || $('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-history' || $('input[type=radio][name=tabs-Icons]:checked').val() == 'mBB-community') {
//        
//            $('#mBLeftBar').css('display', 'none');
//            $('#mBBody').css('width', $wrapW);
//            $('#mBB-wallet').css('text-align', 'center');
//        
//    } else {
//        
//            $('#mBLeftBar').css('display', 'table-cell');    
//    }
//
//};


// GUI elements dynamic sizing and LeftBar visibility
$(window).on("load resize", function(e){
    
	var $wrapH = $('#wrapper').height(),
        $headerH = $('header').height(),
        $tabsH = $('#tabs').height(),
        $jurlH = $('.jurl').height(),
        $mainBodyH = $wrapH - $headerH - $tabsH - $jurlH,
		$lb = $('#mBLeftBar'),
        $lbW = $('#mBLeftBar').width(),
		$mbBodyW = $wrapW - $lbW;
    
	$('#mainBody').css('height', $mainBodyH);
	$('#mBLeftBar').css('height', $mainBodyH);
	$('#mBBody').css('width', $mbBodyW);
    $('.mBB-content').css('height', ($mainBodyH - 50)).css('max-height', $mainBodyH - 50);
    
    // LeftBarVis();
    // Temporary due to LeftBarVis function not being used
    $('#mBB-wallet').css('text-align', 'center');
    
});


// Left bar active/hidden settings on tab clicks
//    $('input[type=radio]').click(function(){ 
//    LeftBarVis(); 
//});


// Fee styling on .paymentForm
$(window).ready(function(){
    
   $(".paymentForm tr td:contains('Fee')").each(function(){
       
       $(this).parent().addClass( "paymentFormFee" );
       
   }); 
    
});


// Temporary - Delete later
$('#mBB-community').height($mbBodyH);


// LOADER
$(document).ready(function(){
    
    NProgress.start();
    
});


function executeDoneFirst (callback) {

    NProgress.done();
    callback();

}

$(window).load(function() {
    
    var $eThing = $('#bg-spin');


    Waves.apiRequest(Waves.api.blocks.last, function(response) {


        if(!response.errorCode) {

           executeDoneFirst(function () {
              $eThing.delay(1000).fadeOut();
           });

        } else {

          $("#networkCheck").html('Failed connecting to Waves');

        }

    });

});


/* FOR LATER REFINEMENT-
 if ($('input[type=radio][name=tabs-Icons]').val() == 'mBB-wallet' && (window.matchMedia('(max-width: 1024px)')).matches) { };
*/
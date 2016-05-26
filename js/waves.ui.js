/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/jquery.growl.js}
 * @depends {3rdparty/clipboard.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    Waves.balance  = 0;
    Waves.hasLocalStorage = false;
    Waves.update;
    Waves.blockUpdate;
    Waves.blockHeight;

    Waves.startSearch = false;
    Waves.stopSearch = false;

    //These are the functions running every Waves.stateIntervalSeconds for each page.
    Waves.pages = {
        'mBB-wallet': function updateWallet () {

            Waves.loadAddressBalance(Waves.address, function (balance) {

                var formatBalance = Waves.formatAmount(balance);

                $("#wavesCurrentBalance").val(formatBalance);
                $("#wavesbalance").html(formatBalance.split(".")[0]);
                $("#wavesbalancedec").html('.'+formatBalance.split(".")[1]);
                $("#balancespan").html(formatBalance +' WAVE');
                $('.balancewaves').html(formatBalance + ' WAVE');
                $(".wB-add").html(Waves.address);

            });

            Waves.getAddressHistory(Waves.address, function(history) {

                var transactionHistory = history[0];
                var appContainer;

                transactionHistory.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                var max = 10;

                $.each(transactionHistory, function(historyKey, historyValue) {
                    
                    if(max > 0) {
                        appContainer += '<tr>';
                        appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                        appContainer += '<td>'+Waves.transactionType(historyValue.type)+'</td>';
                        appContainer += '<td>'+historyValue.sender+'</td>';
                        appContainer += '<td>'+historyValue.recipient+'</td>';
                        appContainer += '<td>'+historyValue.fee+' WVL</td>';
                        appContainer += '<td>'+Waves.formatAmount(historyValue.amount)+' WAVE</td>';
                        appContainer += '</tr>';
                    }
                    max--;
                });

                $("#walletTransactionhistory").html(appContainer);

            
            });


        },
        'mBB-portfolio': function updatePortfolio () {
            //Auto Updating Portfolio Page Items
        },
        'mBB-exchange': function updateExchange() {
            //Auto Updating Exchange Page Items
        },
        'mBB-voting' : function updateVoting() {
            //Auto Updating Voting Page Items
        },
        'mBB-history': function updateHistory() {
            
            Waves.getAddressHistory(Waves.address, function(history) {

                var transactionHistory = history[0];
                var appContainer = '';

                var minYearFrom, maxYearFrom;
                var minYearTo, maxYearTo;

                var fromInput, toInput;

                transactionHistory.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                var amountTransactions = transactionHistory.length;
                var lastKey = amountTransactions - 1;

                if(Waves.startSearch || Waves.stopSearch) {
                    
                    console.log('Filtering from: ' +Waves.startSearch+ ' to: '+Waves.stopSearch);
                }

                $.each(transactionHistory, function(historyKey, historyValue) {

                        if(historyKey === 0) {

                            toInput = Waves.formatTimestamp(historyValue.timestamp, true);
                            maxYearFrom = moment(historyValue.timestamp).year();
                            minYearTo = moment(historyValue.timestamp).year();

                            toInput = moment(historyValue.timestamp).format("DD-MM-YYYY");
                            if(!Waves.startSearch && !Waves.stopSearch) {
                                $("#comboDateTo").val(toInput);
                            }
                        }

                        if(historyKey === lastKey) {
                            fromInput = Waves.formatTimestamp(historyValue.timestamp, true);
                            minYearFrom = moment(historyValue.timestamp).year();
                            maxYearTo = moment(historyValue.timestamp).year();

                            fromInput = moment(historyValue.timestamp).format("DD-MM-YYYY");

                            if(!Waves.startSearch && !Waves.stopSearch) {
                                $("#comboDateFrom").val(fromInput);
                            } 
                        }

                        if(Waves.startSearch || Waves.stopSearch) {

                            var startSearchTimestamp = new Date(Waves.startSearch.split("-").reverse().join("-")).getTime();
                            var stopSearchTimestamp = new Date(Waves.stopSearch.split("-").reverse().join("-")).getTime();

                            stopSearchTimestamp = +stopSearchTimestamp + (20*60*60*1000);
                            //console.log(stopSearchTimestamp);
                            //console.log(historyValue.timestamp);
                            if(startSearchTimestamp < historyValue.timestamp && stopSearchTimestamp > historyValue.timestamp) {

                                appContainer += '<tr>';
                                appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                                appContainer += '<td>'+Waves.transactionType(historyValue.type)+'</td>';
                                appContainer += '<td>'+historyValue.sender+'</td>';
                                appContainer += '<td>'+historyValue.recipient+'</td>';
                                appContainer += '<td>'+historyValue.fee+' WVL</td>';
                                appContainer += '<td>'+Waves.formatAmount(historyValue.amount)+' WAVE</td>';
                                appContainer += '</tr>';

                            } else {

                                //console.log('Sorted out: '+moment(historyValue.timestamp).format("DD-MM-YYYY hh:s"));
                             
                            }

                        } else {

                            appContainer += '<tr>';
                            appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                            appContainer += '<td>'+Waves.transactionType(historyValue.type)+'</td>';
                            appContainer += '<td>'+historyValue.sender+'</td>';
                            appContainer += '<td>'+historyValue.recipient+'</td>';
                            appContainer += '<td>'+historyValue.fee+' WVL</td>';
                            appContainer += '<td>'+Waves.formatAmount(historyValue.amount)+' WAVE</td>';
                            appContainer += '</tr>';
                        }
                });

                $("#transactionhistory").html(appContainer);

                $('#comboDateFrom').combodate({
                    value: fromInput,
                    maxYear: maxYearFrom,
                    minYear: minYearFrom
                });  

                $('#comboDateTo').combodate({
                    value: toInput,
                    maxYear: maxYearTo,
                    minYear: minYearTo
                }); 

                
            });

        },
        'mBB-messages': function updateMessages () {
            //Auto Updating Messages Page Items
        },
        'mBB-community': function updateCommunity () {

            var amountOfBlocks = 100;
            var row = '';
            var endBlock = Waves.blockHeight;
            var startBlock = endBlock - amountOfBlocks;
            Waves.apiRequest(Waves.api.blocks.lastBlocks(startBlock, endBlock), function(response) {

                response.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                $.each(response, function(blockKey, blockData) {

                    var block = Waves.blockHeight - blockKey;
                    row += '<tr class="fade">'+
                        '<td>'+block+'</td>'+
                        '<td>'+Waves.formatTimestamp(blockData.timestamp)+'</td>'+
                        '<td>'+blockData.transactions.length+'</td>'+
                        '<td>'+blockData.generator+'</td>'+
                    '</tr>';

                });

                $("#latestBlocksTable").html(row);

            });

            Waves.apiRequest(Waves.api.transactions.unconfirmed, function(response) {

                response.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                })

                $.each(response, function(blockKey, blockData) {

                    

                });

                var futureBlock = Waves.blockHeight + 1; 
                var unconfirmedRow = '<tr class="fade">'+
                        '<td>'+futureBlock+'</td>'+
                        '<td><i>incoming</i></td>'+
                        '<td>'+response.length+'</td>'+
                        '<td><i>Unknown</i></td>'+
                    '</tr>';

                $("#latestBlocksUnconfirmed").html(unconfirmedRow);

            });

        }
    };

    Waves.updatePage = function ( page ) {
        clearInterval(Waves.update);
        Waves.updateDOM(page);
    }

    Waves.updateDOM = function (page) {

        var interval = Waves.stateIntervalSeconds * 1000;
        if (Waves.pages[page]) {
            Waves.pages[page]();
            Waves.update = setInterval(function() {

            //Updating page functions
             Waves.pages[page]();

             //Load Blocks regularly
             Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
                Waves.blockHeight = result.height;
                $("#blockheight").html(result.height);

            }); 

         }, interval);
        }
    }

    // Show/hide different sections on tab activation
    // The ROUTING
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        clearInterval(Waves.update);
        Waves.updateDOM($(this).val());

        switch(linkType) {
            case 'mBB-portfolio':

            break;
            case 'mBB-history':

                $("#transactionHistorySearch").on("click", function() {

                    console.log($('#comboDateFrom').val());

                    Waves.startSearch = $('#comboDateFrom').val();
                    Waves.stopSearch = $('#comboDateTo').val();

                    Waves.updatePage('mBB-history');
                }); 

            break;
        }
    });


    $("#addContact").on("click", function(e) {
        e.preventDefault();

        $("#contactForm").toggle();
    });

    $("#addContactSubmit").on("click", function(e) {
        e.preventDefault();

        var name = $("#contactname").val();
        var address = $("#contactaddress").val();
        var email = $("#contactemail").val();

        var accountData = {
            name: name,
            address: address,
            email: email
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesContacts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.contacts.push(accountData);
                localStorage.setItem('WavesContacts', JSON.stringify(currentAccounts));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);

            } else {

                var accountArray = { contacts: [accountData] };
                localStorage.setItem('WavesContacts', JSON.stringify(accountArray));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);
            }

        }

    });


    $("#tabs-Icons-community").on("click", function(e) {

        var currentAccounts = localStorage.getItem('WavesContacts');
            currentAccounts = JSON.parse(currentAccounts);

        var row;
        $.each(currentAccounts.contacts, function(contactKey, contactData) {
            
            row += Waves.contactRow(contactData);
    
        });

        $("#contactTable").html(row);

    });    

    $('#uiTB-iconset-logout').click(function() {
        Waves.logout();  
    });


    //Add Copy-to-Clipboard to class clipSpan
    var clipboard = new Clipboard('.clipSpan');

    clipboard.on('success', function(e) {
      
         $.growl.notice({ message: "Address successfully copied to clipboard." });

        e.clearSelection();
    });

    clipboard.on('error', function(e) {
         $.growl.warning({ message: "Could not copy address to clipboard." });
    });

    //How to growl:
    /*
      $.growl({ title: "Growl", message: "The kitten is awake!", url: "/kittens" });
      $.growl.error({ message: "The kitten is attacking!" });
      $.growl.notice({ message: "The kitten is cute!" });
      $.growl.warning({ message: "The kitten is ugly!" });
  */

	return Waves;
}(Waves || {}, jQuery));


$(document).ready(function(){

    Waves.initApp();
    $('.tooltip').tooltipster();
    
    $('#tooltipTest').tooltipster({
        content: $('<span><img src="my-image.png" /> <strong>This text is in bold case !</strong></span>')
    });
    
    $('.tooltip-1').tooltipster({
        theme: 'tooltipster-theme1',
        delay: 1000,
        contentAsHTML: true
    });
    
    $('.tooltip-2').tooltipster({
        theme: 'tooltipster-theme2',
        delay: 1000
    });
    
    $('.tooltip-3').tooltipster({
        theme: 'tooltipster-theme3',
        delay: 1000,
        contentAsHTML: true
    });

});








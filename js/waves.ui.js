
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
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

    Waves.initApp = function () {
        Waves.loadHistory();
        Waves.loadBlockheight();
        Waves.loadBalance();
    }

    Waves.loadBlockheight = function () {

        $.getJSON(Waves.api.blocks.height, function(result) {

            $("#blockheight").html(result.height);

        });

    }

    Waves.loadBalance = function () {


        $.getJSON(Waves.api.address.getAddresses(), function(response) {

            balance = 0;

            var account = 0;

            $.each(response, function(key, value) {

                $.each(value, function(innerkey, innervalue) {

                    $.getJSON(Waves.api.address.balance(innervalue), function(balanceResult) {

                        balance = balance + balanceResult.balance;

                        $("#wavesbalance").html(balance)

                        $("#balancespan").html(balance +' Waves');

                        $('.balancewaves').html(balance + ' Waves');

                        if(typeof(Storage) !== "undefined") {

                            var storageKey = 'waves-'+innervalue;
                            
                            localStorage.innervalue = balanceResult.balance;

                        } else {
                            // Sorry! No Web Storage support.. Let's not save it
                        }

                    });

                    account++;

                });

            });
        });


    }

    Waves.loadHistory = function () {

        var signatures = [];
        var appContainer;

        $.getJSON(server+'/addresses/', function(response) {

            balance = 0;

            $.each(response, function(key, value) {

                $.each(value, function(innerkey, innervalue) {

                    $.getJSON(server+'/transactions/address/'+innervalue, function(transactionHistory) {

                        $.each(transactionHistory[0], function(historyKey, historyValue) {

                            if(historyValue.timestamp > 0) {

                                if(signatures.indexOf(historyValue.signature) < 0) {

                                    signatures.push(historyValue.signature);

                                    appContainer += '<tr>';
                                    appContainer += '<td>'+historyValue.timestamp+'</td>';
                                    appContainer += '<td>'+historyValue.type+'</td>';
                                    appContainer += '<td>'+historyValue.sender+'</td>';
                                    appContainer += '<td>'+historyValue.recipient+'</td>';
                                    appContainer += '<td>'+historyValue.fee+'</td>';
                                    appContainer += '<td>'+historyValue.amount+' Waves</td>';

                                    appContainer += '</tr>';

                                }
                                
                                
                                
                            }


                        });

                        

                    });

                });


            });

            
        });

        setTimeout(function() {

            $("#transactionhistory").html(appContainer);

        }, 1000);

    }


	return Waves;
}(Waves || {}, jQuery));    




$(document).ready(function(){

    Waves.initApp();

    // Show/hide different sections on tab activation
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        switch(linkType) {
            case 'mBB-portfolio':
                loadPayment();
            break;
        }
    });

});
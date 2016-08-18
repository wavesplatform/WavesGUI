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
 * @depends {axlsign/axlsign.js}
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

    if (Waves.UI === undefined)
        Waves.UI = {};

    Waves.UI.accountForm = {
        publicKeySelector: "#publicKeyLockscreen",
        privateKeySelector: "#privateKeyLockscreen",
        addressSelector: "#addresLockscreen",
        seedSelector: "#walletSeed",
        seedWhitespacePopupSelector: '#seed-whitespace-popup',
        accountListSelector: '#wavesAccounts',

        generateAccount: function (seed) {
            var publicKey = Waves.getPublicKey(seed);
            var privateKey = Waves.getPrivateKey(seed);

            $(this.publicKeySelector).html(publicKey);
            $(this.privateKeySelector).html(privateKey);
            $(this.addressSelector).html(Waves.buildAddress(publicKey).getDisplayAddress());
        },
        clearAccount: function () {
            $(this.publicKeySelector).html('');
            $(this.privateKeySelector).html('');
            $(this.addressSelector).html('');
        },
        setWalletSeed: function (value) {
            $(this.seedSelector).val(value);
        },
        getWalletSeed: function() {
            return $(this.seedSelector).val();
        },
        endsWithWhitespace: function (value) {
            return /\s+$/g.test(value);
        },
        appendAccount: function (name, address) {
            $(this.accountListSelector).append('<br><b>' + name + '</b> ' + address.getDisplayAddress());
        },
        registerSeed: function (passphrase) {
            var publicKey = Waves.getPublicKey(passphrase);
            var name = $("#walletName").val();
            var password = $("#walletPassword").val();

            var address = Waves.buildAddress(publicKey);
            var cipher = Waves.encryptWalletSeed(passphrase, password).toString();
            var checksum = converters.byteArrayToHexString(Waves.simpleHash(converters.stringToByteArray(passphrase)));

            var accountData = {
                name: name,
                cipher: cipher,
                checksum: checksum,
                publicKey: publicKey,
                address: address.getRawAddress()
            };

            if (Waves.hasLocalStorage) {

                var currentAccounts = localStorage.getItem('Waves' + Waves.network);
                currentAccounts = JSON.parse(currentAccounts);

                if(currentAccounts !== undefined && currentAccounts !== null) {
                    currentAccounts.accounts.push(accountData);
                    localStorage.setItem('Waves'+Waves.network, JSON.stringify(currentAccounts));
                    this.appendAccount(accountData.name, address);
                } else {
                    var accountArray = { accounts: [accountData] };
                    localStorage.setItem('Waves'+Waves.network, JSON.stringify(accountArray));
                    this.appendAccount(accountData.name, address);
                }

            } else {

                Waves.getAccounts(function(currentAccounts) {

                    var saveData = {
                        name: name,
                        cipher: cipher,
                        checksum: checksum,
                        publicKey: publicKey,
                        address: address.getRawAddress()
                    };

                    if(currentAccounts !== '') {
                        currentAccounts = currentAccounts['WavesAccounts'];

                        currentAccounts.accounts.push(saveData);
                        chrome.storage.sync.set({'WavesAccounts': currentAccounts}, function() {
                            // Notify that we saved.
                            $.growl.notice({ message: "Added Account!" });
                            this.appendAccount(saveData.name, address);
                        });

                    } else {
                        var accountArray = { accounts: [saveData] };
                        chrome.storage.sync.set({'WavesAccounts': accountArray}, function() {
                            // Notify that we saved.
                            $.growl.notice({ message: "Added Account!" });
                            this.appendAccount(saveData.name, address);
                        });
                    }
                });
            }

            accountData.firstTime = true;
            accountData.password = password;
            accountData.passphrase = passphrase;

            Waves.login(accountData);
        }
    };

    Waves.UI.registerForm = {
        id: 'register-form',
        validator: undefined,
        getForm : function() {
            return $('#' + Waves.UI.registerForm.id);
        },
        setupValidation: function() {
            Waves.UI.registerForm.validator = Waves.UI.registerForm.getForm().validate({
                errorClass: 'wInput-error',
                rules: {
                    walletSeed: {
                        required: true,
                        minlength: 25
                    },
                    walletPassword: {
                        required: true,
                        minlength: 8,
                        password: true
                    },
                    walletPasswordConfirm: {
                        equalTo: '#walletPassword'
                    }
                },
                messages: {
                    walletSeed: {
                        required: 'Wallet seed is required',
                        minlength: 'Wallet seed is too short. A secure wallet seed should contain more than 25 characters'
                    },
                    walletPassword: {
                        required: 'A password is required to store your seed safely',
                        minlength: 'Password must be 8 characters or longer'
                    },
                    walletPasswordConfirm: {
                        equalTo: 'Passwords do not match'
                    }
                }
            });
        },
        isValid : function() { return this.getForm().valid(); }
    };

    //Import Waves Account
    $("#import_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#ImportAccHeader").show();
        $("#AccHeader").hide();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();

        Waves.UI.accountForm.setWalletSeed('');
        Waves.UI.accountForm.clearAccount();
    });

    //Create new Waves Acount
    $("#create_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#generateKeys").hide();
        $(".divider-1").hide();
        $("#AccHeader").hide();
        $("#NewAccHeader").show();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();
        // this pop-up can be closed only by pressing the button
        $("#login-wPop-new").modal({
            escapeClose: false,
            clickClose: false,
            showClose: false
        });
        $("#walletSeed").prop('readonly', true);
        NProgress.start();
       
    });

    $('#login-wPop-new').on($.modal.CLOSE, function(event, modal) {
        var passphrase = PassPhraseGenerator.generatePassPhrase();

        Waves.UI.accountForm.setWalletSeed(passphrase);
        Waves.UI.accountForm.generateAccount(passphrase);

        NProgress.done();
    });

    $("#close_create_account_modal").on("click", function(){
        $.modal.close();
    });

    $("#walletSeed").on("change", function() {
        $("#addresLockscreen").html('');
    });

    $("#generateKeys").on("click", function(e) {
        e.preventDefault();
        var walletSeed = Waves.UI.accountForm.getWalletSeed();
        if (walletSeed === undefined || walletSeed.length < 1) {
            $.growl.error({ message: "Wallet seed cannot be empty" });
            
            return;
        }

        if (Waves.UI.accountForm.endsWithWhitespace(walletSeed)) {
            $('#close-seed-whitespace-modal').one("click", function(e) {
                Waves.UI.accountForm.generateAccount(walletSeed);
                $.modal.close();
            });
            $(Waves.UI.accountForm.seedWhitespacePopupSelector).modal();
        }
        else {
            Waves.UI.accountForm.generateAccount(walletSeed);
        }
    });

    $("#generateRandomSeed").on("click", function(e) {
        e.preventDefault();

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        Waves.UI.accountForm.setWalletSeed(passphrase);
        Waves.UI.accountForm.generateAccount(passphrase);
    });

    $(".goBack").on("click", function(e) {
        e.preventDefault();
        if(Waves.hasLocalStorage) {
            location.reload();
        } else {
            chrome.runtime.reload();
        }
    });

    $("#registerSeed").on("click", function(e) {
        e.preventDefault();

        if (!Waves.UI.registerForm.isValid())
            return;

        var passphrase = $("#walletSeed").val();
        if (Waves.UI.accountForm.endsWithWhitespace(passphrase)) {
            $('#close-seed-whitespace-modal').one("click", function(e) {
                $.modal.close();
                Waves.UI.accountForm.registerSeed(passphrase);
            });
            $(Waves.UI.accountForm.seedWhitespacePopupSelector).modal();
        }
        else {
            Waves.UI.accountForm.registerSeed(passphrase);
        }
    });

    Waves.UI.registerForm.setupValidation();

    return Waves;
}(Waves || {}, jQuery));

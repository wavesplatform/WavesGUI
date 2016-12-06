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

(function ($, window) {
    'use strict';

    var $wrapW = $('#wrapper').width(),
        $mbBodyH = $('#mainBody').height();

    // GUI elements dynamic sizing and LeftBar visibility
    $(window).on('load resize', function (e) {

        var $wrapH = $('#wrapper').height(),
            $headerH = $('header').height(),
            $tabsH = $('#tabs').height(),
            $mainBodyH = $wrapH - $headerH - $tabsH,
            $mbBodyW = $wrapW;

        $('#mainBody').css('height', $mainBodyH);
        $('#mBBody').css('width', $mbBodyW);
    });
})(jQuery, window);

$(document).ready(function () {
    $(document).on('click', '.feed_element', function () {
        pageOverlay();
        articleDisplay($(this).data('article_id'), $('#article-template').html());
    });

    $(document).on('click', '.overlay', function () {
        removeArticle();
        removeOverlay();
    });

    //When adding a new comment, if there is highlighted text
    $(document).on('click', '#new-cmnt-btn', function () {
        var name = $('input#name').val(),
            text = $('textarea#comment-content').val(),
            id = $('input#article-id').val(),
            d = new Date();
        var location = 0;
        if (checkSelectedText()) {
            //Want to insert a div w/ a unique location_id so that future comments can identify
            location = "" + name + id + d.getTime() + Math.floor(Math.random()).toString();
            //Put the name and text in the hidden div
            markSelection(location, name, text);
        }
        var content = $('.article_text').html();
        submitComment(name, text, id, content, location);
        return false;
    });

    //When clicking on a comment in the right side comment box, the comment in the article becomes visible
    $(document).on('click', '.single_comment', function () {
        var location = $(this).data('location'),
            //find the div with the relevant location
            marker_div = $('#' + location);
            $(marker_div).show();
    });

    //Hide the in-article comments on click
    $(document).on('click', '.comment_marker', function() {
        $(this).hide();
    });

});

function initialize() {
    var url = "http://feeds.feedburner.com/TechCrunch/",
        feed = new google.feeds.Feed(url);
    feed.load(function(result) {
    if (!result.error) {
        var template = $('#feed-template').html();
        for (var i = 0; i < result.feed.entries.length; i++) {
            var entry = result.feed.entries[i];
            article_db_render(entry, template);
            }
        }
    });
}

function article_db_render(entry, template) {
    var old_image_url = entry.mediaGroups[0].contents[0].url,
        image_url = old_image_url.substring(0, old_image_url.indexOf('?')),
        ajax_url = '/article/new',
        date = Date.parse(entry.publishedDate),
        date_string = dateFormat(date, 'dd-mm-yyyy');

    $.ajax({
        type: "POST",
        url: ajax_url,
        data: {
            link: entry.link,
            content: entry.content,
            title: entry.title,
            image: image_url,
            author: entry.author
        },
        dataType: "json",
        success: function(data) {
            var entry_data = {
                'title': entry.title,
                'publishedDate': date_string,
                'image': image_url,
                'article_id': data['article_id'],
                'author': entry.author
            };
            output = Mustache.render(template, entry_data);
            $('#feed-content').append(output);
        }
    });
}

//Check if the currently selected text is in the article_text div
//Returns false or true
function checkSelectedText() {
    var parentEl = getSelectionParentElement();
        article_text = document.getElementById('article-text'),
        body = document.getElementsByTagName('body')[0];
    if (parentEl === null) {
        return false;
    }
    while (parentEl !== body) {
        var classList = parentEl.className.split(/\s+/);
        for (var i = 0; i < classList.length; i++){
            if (classList[i] === "article_text") {
                return true;
            }
        }
        parentEl = parentEl.parentNode;
    }
    return false;
}

function getSelectionParentElement() {
    var parentEl = null;
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            parentEl = sel.getRangeAt(0).commonAncestorContainer;
            if (parentEl.nodeType != 1) {
                parentEl = parentEl.parentNode;
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        parentEl = document.selection.createRange().parentElement();
    }
    return parentEl;
}

function submitComment(name, text, id, content, location) {
    $.ajax({
        type:"POST",
        url: "/article/" + id + "/comments/new",
        data: {
            'name': name,
            'text': text,
            'id': id,
            'content': content,
            'location': location
        },
        success: function (result) {
            $('.article_text').html(result['content']);
            var template = $('#comments-template').html();
            var output = Mustache.render(template, result);
            $('.comments_container').html(output);
        }
    });
}

function pageOverlay() {
    var overlay = document.createElement('div');
    $(overlay).addClass('overlay');
    $('body').append(overlay);
    $('body').css('overflow-y', 'hidden');
}

function removeOverlay() {
    $('.overlay').remove();
    $('body').css('overflow-y', 'scroll');
}

//Creates a zero-length div at the beginning of the user highlighted text for positioned commenting
function markSelection(location, name, text) {
    var markerTextChar = "\ufeff";
    var markerTextCharEntity = "&#xfeff;";

    var markerEl, markerId = "sel_" + new Date().getTime() + "_" + Math.random().toString().substr(2);

    var selectionEl;

    var location_id = location;

    var sel, range;

    if (document.selection && document.selection.createRange) {
        // Clone the TextRange and collapse
        range = document.selection.createRange().duplicate();
        range.collapse(false);

        // Create the marker element containing a single invisible character by creating literal HTML and insert it
        range.pasteHTML('<span id="' + markerId + '" style="position: relative;">' + markerTextCharEntity + '</span>');
        markerEl = document.getElementById(markerId);
    } else if (window.getSelection) {
        sel = window.getSelection();

        if (sel.getRangeAt) {
            range = sel.getRangeAt(0).cloneRange();
        } else {
            // Older WebKit doesn't have getRangeAt
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);

            // Handle the case when the selection was selected backwards (from the end to the start in the
            // document)
            if (range.collapsed !== sel.isCollapsed) {
                range.setStart(sel.focusNode, sel.focusOffset);
                range.setEnd(sel.anchorNode, sel.anchorOffset);
            }
        }

        range.collapse(false);

        // Create the marker element containing a single invisible character using DOM methods and insert it
        markerEl = document.createElement("span");
        markerEl.id = markerId;
        markerEl.appendChild( document.createTextNode(markerTextChar) );
        range.insertNode(markerEl);
    }

    if (markerEl) {
        // Lazily create element to be placed next to the selection
        if (!selectionEl) {
            selectionEl = document.createElement("div");
            selectionEl.style.position = "absolute";
        }

        var obj = markerEl;
        var left = 0,
            top = 0;
        do {
            left += obj.offsetLeft;
            top += obj.offsetTop;
        } while (obj = obj.offsetParent); 

        // Move the button into place.
        // Substitute your jQuery stuff in here

        //Need to subtract to get the positioning correct for some reason
        $(selectionEl).css({'left': (left - 40) + "px", 'top': (top - 40) + "px", 'display': 'none'});
        var comment_name = document.createElement('div'),
            comment_text = document.createElement('div');
        $(comment_name).addClass('comment_name');
        $(comment_text).addClass('comment_text');
        comment_name.innerHTML = name;
        comment_text.innerHTML = text;
        $(selectionEl).append(comment_name).append(comment_text);
        $(selectionEl).attr('id', location_id);
        $(selectionEl).addClass('comment_marker');
        $('.article_text').append(selectionEl);

        markerEl.parentNode.removeChild(markerEl);
    }
}

function articleDisplay(article_id, template) {
    var url = "/article/" + article_id + "/get";
    $.getJSON(url, function (result) {
        var ouput = Mustache.render(template, result);
        $('body').append(ouput);
        var comments_template = $('#comments-template').html(),
            comments_output = Mustache.render(comments_template, result);
        $('.comments_container').html(comments_output);
    });
}

function removeArticle() {
    $('.article_delete').remove();
}
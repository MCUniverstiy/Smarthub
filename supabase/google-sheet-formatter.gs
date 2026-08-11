/**
 * SMARTHUB — GOOGLE SHEET BEAUTIFIER
 * =====================================================================
 * WHAT THIS IS
 *   An Apps Script that turns the raw Google Form response sheet into
 *   something the office can actually read at a glance: colour-coded
 *   rooms, a Status column with a dropdown, highlighted clashes, frozen
 *   headers, sensible column widths and a summary tab.
 *
 * IT DOES NOT TOUCH YOUR DATA
 *   Every original column stays exactly where it is. The script only
 *   adds formatting, plus two columns at the far right (Status and
 *   Notes) that the form will never overwrite.
 *
 * HOW TO INSTALL (about 2 minutes)
 *   1. Open the response spreadsheet.
 *   2. Extensions -> Apps Script.
 *   3. Delete whatever is in Code.gs and paste this whole file in.
 *   4. Save, then in the toolbar choose the function `beautify` and
 *      press Run. Approve the permission prompt the first time.
 *   5. Reload the spreadsheet. There is now a "SmartHub" menu.
 *
 * OPTIONAL: run it automatically on every new booking
 *   In Apps Script, click the clock icon (Triggers) -> Add Trigger ->
 *   choose `onFormSubmit`, event source "From spreadsheet", event type
 *   "On form submit".
 *
 * NOTE ON THE REAL FIX
 *   Formatting makes the sheet readable, but the sheet still cannot stop
 *   a double booking — it finds out about clashes after the fact, which
 *   is why `highlightClashes` exists at all. The Supabase database in
 *   supabase/schema.sql prevents them in the first place.
 * =====================================================================
 */

/** Brand colours, matching the website's teal-on-slate palette. */
var THEME = {
  headerBg: '#0f766e',   // teal-700
  headerFg: '#ffffff',
  band:     '#f1f5f9',   // slate-100
  border:   '#cbd5e1',   // slate-300
  clash:    '#fee2e2',   // red-100
  clashFg:  '#991b1b',   // red-800
  soon:     '#fef9c3'    // yellow-100
};

/** Colour per room, so the eye can group bookings instantly. */
var ROOM_COLOURS = {
  'Meeting Room A': '#dbeafe',
  'Hot Desk':       '#dcfce7',
  'Meeting Room B': '#e0e7ff',
  'Event Space':    '#fae8ff',
  'Meeting Room C': '#ffedd5',
  'Director Room':  '#fef3c7'
};

var STATUSES = ['New', 'Confirmed', 'Awaiting payment', 'Declined', 'Cancelled'];

/** Adds the custom menu when the spreadsheet opens. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SmartHub')
    .addItem('Format this sheet', 'beautify')
    .addItem('Highlight clashes', 'highlightClashes')
    .addItem('Rebuild summary tab', 'buildSummary')
    .addToUi();
}

/** Runs on every new form submission, when the trigger is installed. */
function onFormSubmit() {
  beautify();
}

/** The main entry point: format everything. */
function beautify() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;

  // ---- Header row -----------------------------------------------------
  var header = sheet.getRange(1, 1, 1, lastCol);
  header
    .setBackground(THEME.headerBg)
    .setFontColor(THEME.headerFg)
    .setFontWeight('bold')
    .setFontSize(11)
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(1, 44);
  sheet.setFrozenRows(1);

  // ---- Body -----------------------------------------------------------
  if (lastRow > 1) {
    var body = sheet.getRange(2, 1, lastRow - 1, lastCol);
    body.setVerticalAlignment('middle').setFontSize(10);
    // Banding makes long rows far easier to follow across the screen.
    clearBandings(sheet);
    sheet.getRange(1, 1, lastRow, lastCol)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
    sheet.getRange(1, 1, lastRow, lastCol)
      .setBorder(true, true, true, true, true, true, THEME.border,
                 SpreadsheetApp.BorderStyle.SOLID);
  }

  autoSizeSensibly(sheet, lastCol);
  addStatusColumn(sheet);
  colourRooms(sheet);
  highlightClashes();
  buildSummary();

  SpreadsheetApp.getActiveSpreadsheet().toast('Sheet formatted.', 'SmartHub', 5);
}

/**
 * Auto-resize, then rein in the columns that auto-size makes absurdly
 * wide (long email addresses and free-text answers).
 */
function autoSizeSensibly(sheet, lastCol) {
  sheet.autoResizeColumns(1, lastCol);
  for (var c = 1; c <= lastCol; c++) {
    var w = sheet.getColumnWidth(c);
    if (w > 240) sheet.setColumnWidth(c, 240);
    if (w < 90) sheet.setColumnWidth(c, 90);
  }
}

/** Remove existing banding so re-running doesn't stack them up. */
function clearBandings(sheet) {
  var bandings = sheet.getBandings();
  for (var i = 0; i < bandings.length; i++) bandings[i].remove();
}

/** Find a column by a fragment of its header text. Returns -1 if absent. */
function findCol(sheet, fragment) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).toLowerCase().indexOf(fragment.toLowerCase()) !== -1) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Append a Status column with a dropdown, and a Notes column, at the
 * far right. The form only ever writes to its own columns, so anything
 * typed here survives new submissions.
 */
function addStatusColumn(sheet) {
  if (findCol(sheet, 'Status') !== -1) return; // already added

  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue('Status');
  sheet.getRange(1, col + 1).setValue('Internal notes');
  sheet.getRange(1, col, 1, 2)
    .setBackground(THEME.headerBg).setFontColor(THEME.headerFg).setFontWeight('bold');

  var rows = Math.max(sheet.getMaxRows() - 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, col, rows, 1).setDataValidation(rule);

  // Default new rows to "New" so nothing sits in limbo unlabelled.
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var range = sheet.getRange(2, col, lastRow - 1, 1);
    var vals = range.getValues();
    for (var i = 0; i < vals.length; i++) {
      if (!vals[i][0]) vals[i][0] = 'New';
    }
    range.setValues(vals);
  }

  sheet.setColumnWidth(col, 140);
  sheet.setColumnWidth(col + 1, 240);

  // Colour the statuses.
  var statusRange = sheet.getRange(2, col, rows, 1);
  var rules = sheet.getConditionalFormatRules();
  var palette = {
    'Confirmed': ['#dcfce7', '#166534'],
    'New': ['#dbeafe', '#1e40af'],
    'Awaiting payment': ['#fef9c3', '#854d0e'],
    'Declined': ['#fee2e2', '#991b1b'],
    'Cancelled': ['#e2e8f0', '#475569']
  };
  Object.keys(palette).forEach(function (label) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(label)
      .setBackground(palette[label][0])
      .setFontColor(palette[label][1])
      .setRanges([statusRange])
      .build());
  });
  sheet.setConditionalFormatRules(rules);
}

/** Tint the room cell using ROOM_COLOURS, matched on the English name. */
function colourRooms(sheet) {
  var col = findCol(sheet, 'Room');
  if (col === -1) col = findCol(sheet, 'Select a Room');
  if (col === -1) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var range = sheet.getRange(2, col, lastRow - 1, 1);
  var values = range.getValues();
  var colours = values.map(function (row) {
    var text = String(row[0]);
    var found = null;
    Object.keys(ROOM_COLOURS).forEach(function (name) {
      // The form stores "Meeting Room A / 會議室 A / 会议室 A"
      if (text.indexOf(name) !== -1) found = ROOM_COLOURS[name];
    });
    return [found || '#ffffff'];
  });
  range.setBackgrounds(colours);
  range.setWrap(true);
}

/**
 * highlightClashes — paint any two rows red that book the same room on
 * the same date with overlapping times.
 *
 * This is the sheet doing after the fact what the database does up
 * front. It cannot prevent the clash; it can only make sure a human
 * spots it before both customers turn up.
 */
function highlightClashes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return;

  var roomCol = findCol(sheet, 'Room');
  var dateCol = findCol(sheet, 'Booking Date');
  var startCol = findCol(sheet, 'Start Time');
  var endCol = findCol(sheet, 'End Time');
  if (roomCol === -1 || dateCol === -1 || startCol === -1 || endCol === -1) return;

  var n = lastRow - 1;
  var rooms = sheet.getRange(2, roomCol, n, 1).getValues();
  var dates = sheet.getRange(2, dateCol, n, 1).getValues();
  var starts = sheet.getRange(2, startCol, n, 1).getValues();
  var ends = sheet.getRange(2, endCol, n, 1).getValues();

  var statusCol = findCol(sheet, 'Status');
  var statuses = statusCol !== -1
    ? sheet.getRange(2, statusCol, n, 1).getValues()
    : null;

  var clash = [];
  for (var i = 0; i < n; i++) clash.push(false);

  for (var a = 0; a < n; a++) {
    for (var b = a + 1; b < n; b++) {
      // A cancelled or declined booking no longer holds the room.
      if (statuses) {
        var sa = String(statuses[a][0]), sb = String(statuses[b][0]);
        if (sa === 'Cancelled' || sa === 'Declined') continue;
        if (sb === 'Cancelled' || sb === 'Declined') continue;
      }
      if (String(rooms[a][0]) !== String(rooms[b][0])) continue;
      // The hot desk is shared, so overlapping bookings are expected.
      if (String(rooms[a][0]).indexOf('Hot Desk') !== -1) continue;
      if (keyOf(dates[a][0]) !== keyOf(dates[b][0])) continue;

      var s1 = mins(starts[a][0]), e1 = mins(ends[a][0]);
      var s2 = mins(starts[b][0]), e2 = mins(ends[b][0]);
      if (s1 === null || s2 === null) continue;
      // [) bounds: touching at an edge is not a clash.
      if (s1 < e2 && s2 < e1) { clash[a] = true; clash[b] = true; }
    }
  }

  var lastCol = sheet.getLastColumn();
  for (var r = 0; r < n; r++) {
    if (clash[r]) {
      sheet.getRange(r + 2, 1, 1, lastCol)
        .setBackground(THEME.clash).setFontColor(THEME.clashFg);
    }
  }

  var count = clash.filter(Boolean).length;
  if (count > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      count + ' rows overlap another booking. They are shown in red.',
      'Clashes found', 8);
  }
}

/** Normalise a date cell to YYYY-MM-DD for comparison. */
function keyOf(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).trim();
}

/** Convert a time cell to minutes since midnight. Handles Date and text. */
function mins(v) {
  if (v instanceof Date) return v.getHours() * 60 + v.getMinutes();
  var s = String(v).trim();
  // Matches "10:00", "10:00:00", "1:30 PM"
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  var h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
  if (/pm/i.test(s) && h < 12) h += 12;
  if (/am/i.test(s) && h === 12) h = 0;
  return h * 60 + mm;
}

/**
 * buildSummary — a small dashboard tab: how many bookings per room, per
 * status, and the next fortnight's schedule.
 */
function buildSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheets()[0];
  var name = 'Summary';
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name, 0);
  sheet.clear();

  var lastRow = src.getLastRow();
  sheet.getRange('A1').setValue('SmartHub bookings at a glance')
    .setFontSize(16).setFontWeight('bold').setFontColor('#0f766e');
  sheet.getRange('A2').setValue('Updated ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMM yyyy HH:mm'))
    .setFontColor('#64748b').setFontSize(9);

  if (lastRow < 2) {
    sheet.getRange('A4').setValue('No bookings yet.');
    return;
  }

  var roomCol = findCol(src, 'Room');
  var statusCol = findCol(src, 'Status');
  var n = lastRow - 1;

  // Count by room.
  var counts = {};
  if (roomCol !== -1) {
    var rooms = src.getRange(2, roomCol, n, 1).getValues();
    rooms.forEach(function (r) {
      var label = String(r[0]).split(' / ')[0] || 'Unknown';
      counts[label] = (counts[label] || 0) + 1;
    });
  }

  sheet.getRange('A4').setValue('Bookings by room').setFontWeight('bold');
  var row = 5;
  Object.keys(counts).forEach(function (k) {
    sheet.getRange(row, 1).setValue(k);
    sheet.getRange(row, 2).setValue(counts[k]);
    if (ROOM_COLOURS[k]) sheet.getRange(row, 1).setBackground(ROOM_COLOURS[k]);
    row++;
  });

  // Count by status.
  if (statusCol !== -1) {
    var scounts = {};
    src.getRange(2, statusCol, n, 1).getValues().forEach(function (r) {
      var label = String(r[0]) || 'New';
      scounts[label] = (scounts[label] || 0) + 1;
    });
    row++;
    sheet.getRange(row, 1).setValue('Bookings by status').setFontWeight('bold');
    row++;
    Object.keys(scounts).forEach(function (k) {
      sheet.getRange(row, 1).setValue(k);
      sheet.getRange(row, 2).setValue(scounts[k]);
      row++;
    });
  }

  sheet.getRange(4, 1, row, 1).setFontSize(11);
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 80);
  sheet.getRange('A1:B1').merge();
}

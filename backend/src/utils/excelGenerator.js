const ExcelJS = require('exceljs');
const Assignment = require('../models/Assignment');

/**
 * Generate Excel report for shift history
 * @param {Object} filter - MongoDB filter object for querying assignments
 * @param {String} reportType - 'week' | 'month' | 'year' | 'custom'
 * @returns {Promise<Buffer>} Excel file buffer
 */
exports.generateShiftHistoryExcel = async (filter, reportType = 'custom') => {
  console.log('Excel Generator - Filter:', JSON.stringify(filter));

  // Fetch shift history data
  const shifts = await Assignment.find(filter)
    .populate('staffId', 'name email phone')
    .populate('clientId', 'name ndisNumber careLevel')
    .populate('lockedBy', 'name')
    .sort({ completedAt: -1, startDate: -1 });

  console.log(`Excel Generator - Found ${shifts.length} shifts`);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties for better compatibility
  workbook.creator = 'NexCare NDIS Management System';
  workbook.lastModifiedBy = 'NexCare';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Shift History', {
    properties: { tabColor: { argb: 'FF7e3285' } }
  });

  // Set column widths and headers
  worksheet.columns = [
    { header: 'Client Name', key: 'clientName', width: 20 },
    { header: 'Staff Name', key: 'staffName', width: 20 },
    { header: 'Shift Date', key: 'shiftDate', width: 15 },
    { header: 'Start Time', key: 'startTime', width: 15 },
    { header: 'End Time', key: 'endTime', width: 15 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Shift Status', key: 'status', width: 12 },
    { header: 'Supervisor Name', key: 'supervisorName', width: 20 },
    { header: 'Notes Summary', key: 'notes', width: 40 }
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7e3285' } // Brand purple color
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Helper function to parse shift time
  const parseShiftTime = (shift) => {
    if (!shift) return { start: 'N/A', end: 'N/A' };
    const parts = shift.split(' - ');
    return {
      start: parts[0] || 'N/A',
      end: parts[1] || 'N/A'
    };
  };

  // Helper function to calculate shift duration
  const calculateDuration = (shift) => {
    if (!shift) return 'N/A';

    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const [startStr, endStr] = shift.split(' - ');
    const startMinutes = parseTime(startStr);
    const endMinutes = parseTime(endStr);

    if (startMinutes === null || endMinutes === null) return 'N/A';

    let duration = endMinutes - startMinutes;
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours}h ${minutes}m`;
  };

  // Add data rows
  console.log(`Adding ${shifts.length} rows to Excel...`);

  shifts.forEach((shift, index) => {
    const shiftTimes = parseShiftTime(shift.shift);
    const rowData = {
      clientName: shift.clientId?.name || 'Unknown Client',
      staffName: shift.staffId?.name || 'Unknown Staff',
      shiftDate: shift.completedAt
        ? new Date(shift.completedAt).toLocaleDateString()
        : new Date(shift.startDate).toLocaleDateString(),
      startTime: shiftTimes.start,
      endTime: shiftTimes.end,
      duration: calculateDuration(shift.shift),
      status: shift.status === 'Previous' ? 'Completed' : shift.status,
      supervisorName: shift.lockedBy?.name || 'N/A',
      notes: shift.shiftNotes
        ? shift.shiftNotes.substring(0, 200) + (shift.shiftNotes.length > 200 ? '...' : '')
        : ''
    };

    const row = worksheet.addRow(rowData);

    if (index === 0) {
      console.log('First row data:', rowData);
    }

    // Alternate row colors for better readability
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }
      };
    }

    // Wrap text in notes column
    row.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // Add summary row at the bottom
  worksheet.addRow({}); // Empty row for spacing

  const summaryRow = worksheet.addRow({
    clientName: 'TOTAL',
    staffName: `${shifts.length} shift${shifts.length !== 1 ? 's' : ''}`,
    shiftDate: '',
    startTime: '',
    endTime: '',
    duration: '',
    status: '',
    supervisorName: '',
    notes: `Report generated: ${new Date().toLocaleString()}`
  });

  summaryRow.font = { bold: true, color: { argb: 'FF000000' } };
  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };

  // If no data, add a note
  if (shifts.length === 0) {
    const noDataRow = worksheet.addRow({
      clientName: 'No shifts found',
      staffName: 'for the selected period',
      shiftDate: '',
      startTime: '',
      endTime: '',
      duration: '',
      status: '',
      supervisorName: '',
      notes: ''
    });
    noDataRow.font = { italic: true, color: { argb: 'FF999999' } };
  }

  // Freeze the header row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Generate buffer with proper options
  const buffer = await workbook.xlsx.writeBuffer({
    useStyles: true,
    useSharedStrings: true
  });

  // Verify buffer is valid
  if (!buffer || buffer.length === 0) {
    throw new Error('Failed to generate Excel file: Buffer is empty');
  }

  return buffer;
};

/**
 * Get date filter based on report type
 * @param {String} reportType - 'today' | 'week' | 'month' | 'year' | 'custom'
 * @param {Date} startDate - For custom range
 * @param {Date} endDate - For custom range
 * @returns {Object} MongoDB date filter
 */
exports.getDateFilter = (reportType, startDate = null, endDate = null) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();
  const dateFilter = {};

  // Use startDate field to match the shift history query logic
  const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, date + 1, 0, 0, 0, 0));

  if (reportType === 'today') {
    dateFilter.startDate = { $gte: startOfDay, $lt: endOfDay };
  } else if (reportType === 'week') {
    const weekAgo = new Date(Date.UTC(year, month, date - 7));
    dateFilter.startDate = { $gte: weekAgo, $lt: endOfDay };
  } else if (reportType === 'month') {
    const monthAgo = new Date(Date.UTC(year, month - 1, date));
    dateFilter.startDate = { $gte: monthAgo, $lt: endOfDay };
  } else if (reportType === 'year') {
    const yearAgo = new Date(Date.UTC(year - 1, month, date));
    dateFilter.startDate = { $gte: yearAgo, $lt: endOfDay };
  } else if (reportType === 'custom' && startDate && endDate) {
    dateFilter.startDate = {
      $gte: new Date(startDate),
      $lt: new Date(endDate)
    };
  }

  console.log('Date filter for Excel:', dateFilter);
  return dateFilter;
};

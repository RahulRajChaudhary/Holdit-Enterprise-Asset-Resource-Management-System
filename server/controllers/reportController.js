const reportService = require('../services/reportService');

async function summary(req, res) {
  const [
    utilizationByDepartment,
    mostUsedAssets,
    idleAssets,
    maintenanceFrequency,
    dueForMaintenance,
    nearingRetirement,
    bookingHeatmap,
  ] = await Promise.all([
    reportService.utilizationByDepartment(),
    reportService.mostUsedAssets(),
    reportService.idleAssets(),
    reportService.maintenanceFrequency(),
    reportService.dueForMaintenance(),
    reportService.nearingRetirement(),
    reportService.bookingHeatmap(),
  ]);

  res.json({
    utilizationByDepartment,
    mostUsedAssets,
    idleAssets,
    maintenanceFrequency,
    dueForMaintenance,
    nearingRetirement,
    bookingHeatmap,
  });
}

module.exports = { summary };

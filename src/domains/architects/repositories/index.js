/**
 * Repository Index
 * Central export untuk semua repositories
 */

const architectRepository = require('./architect.repository');
const certificationRepository = require('./certification.repository');
const portfolioLinkRepository = require('./portfolio-link.repository');
const transactionRepository = require('./transaction.repository');
const designRepository = require('./design.repository'); // NEW

module.exports = {
  architectRepository,
  certificationRepository,
  portfolioLinkRepository,
  transactionRepository,
  designRepository, // NEW
};
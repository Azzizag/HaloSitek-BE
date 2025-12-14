/**
 * Portfolio Link Routes
 * Routes untuk portfolio link management
 */

const express = require('express');
const router = express.Router();

const portfolioLinkController = require('../controllers/portfolio-link.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/portfolio-links/:id
 * @desc    Get portfolio link by ID
 * @access  Public
 */
router.get('/:id', portfolioLinkController.getPortfolioLinkById);

// ============================================
// PROTECTED ROUTES (Architect only)
// ============================================

/**
 * @route   POST /api/architects/auth/portfolio-links
 * @desc    Create new portfolio link
 * @access  Private (Architect only)
 */
router.post(
  '/architect/my-portfolio-links',
  authMiddleware.verifyArchitect,
  portfolioLinkController.createPortfolioLink
);

/**
 * @route   GET /api/architects/auth/portfolio-links
 * @desc    Get my portfolio links
 * @access  Private (Architect only)
 */
router.get(
  '/architect/my-portfolio-links',
  authMiddleware.verifyArchitect,
  portfolioLinkController.getMyPortfolioLinks
);

/**
 * @route   POST /api/architects/auth/portfolio-links/reorder
 * @desc    Reorder portfolio links
 * @access  Private (Architect only)
 */
router.post(
  '/architect/my-portfolio-links/reorder',
  authMiddleware.verifyArchitect,
  portfolioLinkController.reorderPortfolioLinks
);

/**
 * @route   PUT /api/architects/auth/portfolio-links/:id
 * @desc    Update portfolio link
 * @access  Private (Architect only)
 */
router.put(
  '/architect/my-portfolio-links/:id',
  authMiddleware.verifyArchitect,
  portfolioLinkController.updatePortfolioLink
);

/**
 * @route   DELETE /api/architects/auth/portfolio-links/:id
 * @desc    Delete portfolio link
 * @access  Private (Architect only)
 */
router.delete(
  '/architect/my-portfolio-links/:id',
  authMiddleware.verifyArchitect,
  portfolioLinkController.deletePortfolioLink
);

module.exports = router;
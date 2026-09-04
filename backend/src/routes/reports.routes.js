import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router=Router(); router.use(requireAuth,requireRole('admin','staff'));
router.get('/overview',async(req,res,next)=>{try{const [jobs,printers,users,qr]=await Promise.all([query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='completed')::int AS completed,COUNT(*) FILTER(WHERE status='failed')::int AS failed,COUNT(*) FILTER(WHERE status IN ('queued','processing'))::int AS active FROM print_jobs`),query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='online')::int AS online FROM printers`),query(`SELECT COUNT(*)::int AS total FROM users WHERE status='active'`),query(`SELECT COUNT(*)::int AS total FROM qr_codes WHERE is_active=true`)]);res.json({success:true,data:{printJobs:jobs.rows[0],printers:printers.rows[0],users:users.rows[0],qrCodes:qr.rows[0]}});}catch(e){next(e);}});
export default router;

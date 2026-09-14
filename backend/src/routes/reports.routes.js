import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router=Router();
router.use(requireAuth,requireRoles('admin','staff','operator'));
router.get('/summary',async(req,res,next)=>{try{const [printers,jobs,agents]=await Promise.all([query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='online' AND is_enabled=true)::int online FROM printers`),query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='queued')::int queued,count(*) FILTER(WHERE status='printing')::int printing,count(*) FILTER(WHERE status='failed')::int failed FROM print_jobs`),query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='online')::int online FROM printer_agents WHERE is_active=true`)]);res.json({success:true,data:{printers:printers.rows[0],jobs:jobs.rows[0],agents:agents.rows[0]}});}catch(e){next(e);}});
router.get('/jobs',async(req,res,next)=>{try{const {rows}=await query(`SELECT status,count(*)::int count FROM print_jobs GROUP BY status ORDER BY status`);res.json({success:true,data:rows});}catch(e){next(e);}});
export default router;

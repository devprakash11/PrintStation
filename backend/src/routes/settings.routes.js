import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router=Router(); router.use(requireAuth,requireRole('admin'));
router.get('/',async(req,res,next)=>{try{const r=await query('SELECT key,value,updated_at FROM system_settings ORDER BY key');res.json({success:true,data:r.rows});}catch(e){next(e);}});
router.patch('/:key',async(req,res,next)=>{try{if(typeof req.body.value==='undefined')return res.status(400).json({success:false,message:'value is required.'});const r=await query(`INSERT INTO system_settings(key,value,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=NOW() RETURNING *`,[req.params.key,JSON.stringify(req.body.value),req.user.sub]);res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
export default router;

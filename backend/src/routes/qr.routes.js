import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router=Router();

// Public endpoint used after a customer scans a printer QR code.
router.get('/public/:token',async(req,res,next)=>{try{const r=await query(`SELECT q.id,q.token,q.label,q.expires_at,p.id AS printer_id,p.name AS printer_name,p.model,p.location,p.status FROM qr_codes q JOIN printers p ON p.id=q.printer_id WHERE q.token=$1 AND q.is_active=true`,[req.params.token]);if(!r.rowCount)return res.status(404).json({success:false,message:'QR code is invalid or inactive.'});const item=r.rows[0];if(item.expires_at&&new Date(item.expires_at)<new Date())return res.status(410).json({success:false,message:'QR code has expired.'});res.json({success:true,data:item});}catch(e){next(e);}});

router.use(requireAuth,requireRole('admin','staff'));
router.get('/',async(req,res,next)=>{try{const r=await query(`SELECT q.*,p.name AS printer_name FROM qr_codes q LEFT JOIN printers p ON p.id=q.printer_id ORDER BY q.created_at DESC`);res.json({success:true,data:r.rows});}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{try{const {printer_id,label,expires_at}=req.body;if(!printer_id||!label)return res.status(400).json({success:false,message:'printer_id and label are required.'});const token=randomUUID();const r=await query(`INSERT INTO qr_codes(printer_id,label,token,expires_at,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,[printer_id,label,token,expires_at||null,req.user.sub]);res.status(201).json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.get('/:id',async(req,res,next)=>{try{const r=await query('SELECT * FROM qr_codes WHERE id=$1',[req.params.id]);if(!r.rowCount)return res.status(404).json({success:false,message:'QR code not found.'});res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.delete('/:id',async(req,res,next)=>{try{await query('DELETE FROM qr_codes WHERE id=$1',[req.params.id]);res.status(204).end();}catch(e){next(e);}});
export default router;

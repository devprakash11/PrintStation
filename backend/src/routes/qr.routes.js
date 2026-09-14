import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();
router.get('/public/:token', async(req,res,next)=>{try{const {rows}=await query(`SELECT q.id,q.token,q.expires_at,q.is_active,p.id printer_id,p.name,p.model,p.status,p.is_enabled FROM qr_codes q JOIN printers p ON p.id=q.printer_id WHERE q.token=$1`,[req.params.token]); const row=rows[0]; if(!row || !row.is_active || (row.expires_at && new Date(row.expires_at)<new Date()) || !row.is_enabled) return res.status(404).json({success:false,message:'This print station is unavailable.'}); res.json({success:true,data:{printerId:row.printer_id,printerName:row.name,model:row.model,status:row.status,available:row.status==='online'}});}catch(e){next(e);}});
router.use(requireAuth, requireRoles('admin','staff','operator'));
router.get('/',async(req,res,next)=>{try{const {rows}=await query(`SELECT q.*,p.name printer_name FROM qr_codes q JOIN printers p ON p.id=q.printer_id ORDER BY q.created_at DESC`);res.json({success:true,data:rows});}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{try{const p=z.object({printerId:z.string().uuid(),label:z.string().max(120).optional().default(''),expiresAt:z.string().datetime().nullable().optional()}).parse(req.body);const token=crypto.randomUUID();const {rows}=await query('INSERT INTO qr_codes(printer_id,label,token,expires_at,is_active,created_by) VALUES($1,$2,$3,$4,true,$5) RETURNING *',[p.printerId,p.label,token,p.expiresAt||null,req.user.id]);res.status(201).json({success:true,data:{...rows[0],url:`${env.qrBaseUrl}?station=${token}`}});}catch(e){next(e);}});
router.patch('/:id',async(req,res,next)=>{try{const p=z.object({isActive:z.boolean().optional(),expiresAt:z.string().datetime().nullable().optional(),label:z.string().max(120).optional()}).parse(req.body);const fields=[];const values=[];for(const [k,v] of Object.entries(p)){if(v===undefined)continue;const col={isActive:'is_active',expiresAt:'expires_at',label:'label'}[k];fields.push(`${col}=$${values.length+1}`);values.push(v);}if(!fields.length)return res.status(400).json({success:false,message:'No changes supplied.'});values.push(req.params.id);const {rows}=await query(`UPDATE qr_codes SET ${fields.join(',')} WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({success:false,message:'QR code not found.'});res.json({success:true,data:rows[0]});}catch(e){next(e);}});
export default router;

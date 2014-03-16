#!/bin/sh
cdo -f nc import_binary S/S3D_intpo.ctl S/s.nc
cdo -f nc import_binary T/T3D_intpo.ctl T/t.nc
cdo -f nc import_binary U/U3D_intpo.ctl U/u.nc
cdo -f nc import_binary V/V3D_intpo.ctl V/v.nc
cdo -f nc import_binary W/W3D_intpo.ctl W/w.nc
cdo -f nc import_binary HM/HM_intpo.ctl HM/hm.nc

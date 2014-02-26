#!/bin/sh

for date in 20060110 20060111 20060112 20060113 20060114 20060115 20060116 20060117 20060118 20060119
do
rm VARS/$date
touch VARS/$date
cat S/S3D_intpo.20060110 >> VARS/$date
cat T/T3D_intpo.20060110 >> VARS/$date
cat U/U3D_intpo.20060110 >> VARS/$date
cat V/V3D_intpo.20060110 >> VARS/$date
cat W/W3D_intpo.20060110 >> VARS/$date
done
cdo -f nc import_binary VARS/variables.ctl VARS/ocean.nc

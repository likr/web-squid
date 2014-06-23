proxy_env:
  http_proxy: http://proxy.kuins.net:8080/
  https_proxy: http://proxy.kuins.net:8080/
  ftp_proxy: http://proxy.kuins.net:8080/
data:
  - name: s
    file: /mnt/hgfs/vmshare/GRADS/S/S3D_intpo.ctl
  - name: t
    file: /mnt/hgfs/vmshare/GRADS/T/T3D_intpo.ctl
  - name: u
    file: /mnt/hgfs/vmshare/GRADS/U/U3D_intpo.ctl
  - name: v
    file: /mnt/hgfs/vmshare/GRADS/V/V3D_intpo.ctl
  - name: w
    file: /mnt/hgfs/vmshare/GRADS/W/W3D_intpo.ctl
  - name: hm
    file: /mnt/hgfs/vmshare/GRADS/HM/HM_intpo.ctl
  - name: hmgrad
    file: /mnt/hgfs/vmshare/GRADS/HM/HMgrad_intpo.ctl
  - name: mld
    file: /mnt/hgfs/vmshare/GRADS/HM/MLD_intpo.ctl

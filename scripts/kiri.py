from __future__ import print_function
from datetime import datetime
from bisect import bisect_left, bisect_right
import csv
import itertools
import numpy
import scipy
import scipy.interpolate

class Row(object):
    def __init__(self, x, y, date):
        self.data = []
        self.day = date.day
        self.x = x
        self.y = y

def load_row(row):
    y, x = float(row[8]), float(row[9])
    cpue = float(row[41])
    date = datetime.strptime(row[5], '%Y/%m/%d %H:%M')
    o = Row(x, y, date)
    o.data.append(cpue)
    return o


def load_grid(filename):
    rows = open(filename).readlines()[4:-4]
    data = ''.join(rows).split()
    it = iter(data)
    next(it)
    xn = int(next(it))
    next(it)
    x = [float(next(it)) for _ in range(xn)]
    next(it)
    yn = int(next(it))
    next(it)
    y = [float(next(it)) for _ in range(yn)]
    next(it)
    zn = int(next(it))
    next(it)
    z = [float(next(it)) for _ in range(zn)]
    return x, y, z

def main():
    rows = list(csv.reader(open('cpue.csv')))
    data = [load_row(row) for row in rows[1:]]
    x, y, _ = load_grid('S/S3D_intpo.ctl')
    fname = 'S/S3D_intpo.20060116'
    values = numpy.fromfile(fname, '>f4')
    values.shape = (54, 442, 673)

    writer = csv.writer(open('three/data/kiri.csv', 'w'))
    for i, xval in enumerate(x):
        if xval >= 140 and xval <= 150:
            for j, yval in enumerate(y):
                rows.append((xval, yval, values[0, j, i]))
    writer.writerows(rows)

    rows = [];
    writer = csv.writer(open('three/data/x.csv', 'w'))
    rows.append(x);
    writer.writerows(rows)

    rows = [];
    writer = csv.writer(open('three/data/y.csv', 'w'))
    rows.append(y);
    writer.writerows(rows)


if __name__ == '__main__':
    main()

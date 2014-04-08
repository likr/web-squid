# coding: utf-8
from __future__ import print_function
from os import path
import csv
import math


def main():
    basepath = path.abspath(path.dirname(__file__)) + '/../'
    filepath1 = basepath + 'data/AMSJGCPUE1999-2012SAFcl2_move/AMSJGCPUE1999-2012SAFcl2_move{0}.txt'
    filepath2 = basepath + 'data/nfsquid2013summer_r2_move/nfsquid2013summer_r2_move{0}.txt'
    variables = [
        'HM',
        'HMgrad',
        'S',
        'T',
        'U',
        'V',
        'W',
    ]

    f = open(filepath1.format(variables[0]))
    next(f)
    labels = ['YEAR', 'MONTH', 'DAY', 'LAT', 'LON', 'CPUE']
    data1 = [[int(r[0]), int(r[1]), int(r[2]),
              float(r[3]), float(r[4]), math.log(max(0.1, float(r[6])))]
             for r in map(lambda r: r.split(), f)]

    g = open(filepath2.format(variables[0]))
    next(g)
    data2 = [[int(r[1]), int(r[2]), int(r[3]),
              float(r[8]), float(r[9]), math.log(max(0.1, float(r[19])))]
             for r in map(lambda r: r.split(), g)]

    for variable in variables:
        f = open(filepath1.format(variable))
        labels.extend(next(f).split()[11:])
        for d, row in zip(data1, f):
            d.extend([float(v) for v in row.split()[11:]])

        g = open(filepath2.format(variable))
        next(g)
        for d, row in zip(data2, g):
            d.extend([float(v) for v in row.split()[21:]])

    writer = csv.writer(open(basepath + 'public/cpue-var.csv', 'w'))
    writer.writerow(labels)
    writer.writerows(data1)
    writer.writerows(data2)

if __name__ == '__main__':
    main()

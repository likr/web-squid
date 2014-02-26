from __future__ import print_function
import csv
import random
import numpy
from sem import sem


MAX_DEPTH = 54
HOGE = True


def normalize(v):
    return (v - numpy.average(v)) / numpy.std(v)


def regression(x, y, n=1):
    A = numpy.vstack(x ** i for i in range(n + 1)).T
    phi = numpy.linalg.lstsq(A, y)[0]
    return numpy.dot(A, phi)


def maxcoef_label(target, vlabels, data):
    x = [regression(data[l], data[target]) for l in [target] + vlabels]
    return vlabels[(numpy.corrcoef(x)[0][1:] ** 2).argmax()]


def analyze_hsi(x, y, n=1):
    def reg(xi, y):
        A = numpy.vstack(xi ** i for i in range(n + 1)).T
        return numpy.linalg.lstsq(A, y)[0]

    def g(xi, phi):
        A = numpy.array([xi ** i for i in range(n + 1)])
        return max(0, numpy.dot(A, phi))
    a = [reg(xi, y) for xi in x]
    d = 1 / len(x)
    return lambda x:\
        (numpy.prod([g(xi, ai) for ai, xi in zip(a, x)], axis=0) ** d)


def analyze_sem(x, y):
    x = numpy.vstack((y, x))
    S = numpy.cov(x)

    n = len(x)
    alpha = [
        (0, 1),
        (0, 2),
        (0, 3),
        (0, 4),
        (1, 3),
        (1, 4),
        (2, 3),
        (2, 4),
    ]
    sigma = [
        (0, 0),
        (1, 1),
        (2, 2),
        (3, 3),
        (4, 4),
        (1, 2),
        (3, 4),
    ]
    A, _, gfi = sem(n, alpha, sigma, S)
    a = A[0][1:]
    y_bar = numpy.average(y)
    if HOGE:
        return lambda x: numpy.dot(a, x) + y_bar, gfi
    else:
        x_bar = numpy.array([numpy.average(xi) for xi in x])[1:]
        return lambda x: numpy.dot(a, x - x_bar) + y_bar, gfi


def analyze_reg(x, y):
    x = numpy.vstack((x, numpy.ones(len(y)))).T
    a = numpy.linalg.lstsq(x, y)[0]
    a, a0 = a[:-1], a[-1]
    return lambda x: numpy.dot(x, a) + a0


def estimate(data):
    slabels = ['S{}'.format(d) for d in range(MAX_DEPTH)]
    tlabels = ['T{}'.format(d) for d in range(MAX_DEPTH)]
    #ulabels = ['U{}'.format(d) for d in range(MAX_DEPTH)]
    #vlabels = ['V{}'.format(d) for d in range(MAX_DEPTH)]
    wlabels = ['W{}'.format(d) for d in range(MAX_DEPTH)]
    rlabels = ['R{}'.format(d) for d in range(MAX_DEPTH)]

    xlabels = []
    xlabels.append(maxcoef_label('cpue', slabels, data))
    xlabels.append(maxcoef_label('cpue', tlabels, data))
    xlabels.append(maxcoef_label('cpue', rlabels, data))
    xlabels.append(maxcoef_label('cpue', wlabels, data))

    #print(xlabels)
    y = data['cpue']
    x = numpy.vstack(data[label] for label in xlabels)

    f, gfi = analyze_sem(x, y)
    g = analyze_reg(x, y)
    h = analyze_hsi(x, y, 1)
    h6 = analyze_hsi(x, y, 6)

    return xlabels, f, g, h, h6, gfi


def main():
    rows = list(csv.reader(open('cpue-var.csv')))
    labels = rows[0]
    data = {l: numpy.array([float(r[i]) for r in rows[1:]])
            for i, l in enumerate(labels)}
    for d in range(MAX_DEPTH):
        u = data['U{}'.format(d)]
        v = data['V{}'.format(d)]
        data['absU{}'.format(d)] = numpy.abs(u)
        data['absV{}'.format(d)] = numpy.abs(v)
        data['R{}'.format(d)] = numpy.sqrt(u * u + v * v)

    num = 100
    size = len(rows[1:])
    results = []
    for _ in range(num):
        result = {}
        indices = list(range(size))
        random.shuffle(indices)
        indices = indices[:size // 10 * 8]
        sample_data = {k: v[indices] for k, v in data.items()}
        labels, f, g, h, h6, gfi = estimate(sample_data)
        y = data['cpue']
        x = numpy.vstack(data[label] for label in labels)

        fx_sample = numpy.array([f(xi) for xi in x[:, indices].T])
        gx_sample = numpy.array([g(xi) for xi in x[:, indices].T])
        hx_sample = numpy.array([h(xi) for xi in x[:, indices].T])
        h6x_sample = numpy.array([h6(xi) for xi in x[:, indices].T])

        result['cor_f_sample'] = numpy.corrcoef((y[indices], fx_sample))[0][1]
        result['cor_g_sample'] = numpy.corrcoef((y[indices], gx_sample))[0][1]
        result['cor_h_sample'] = numpy.corrcoef((y[indices], hx_sample))[0][1]
        result['cor_h6_sample'] = numpy.corrcoef((y[indices],
                                                  h6x_sample))[0][1]

        if HOGE:
            x_bar = numpy.average(x, axis=1)
            fx = numpy.array([f(xi - x_bar) for xi in x.T])
        else:
            fx = numpy.array([f(xi) for xi in x.T])
        gx = numpy.array([g(xi) for xi in x.T])
        hx = numpy.array([h(xi) for xi in x.T])
        h6x = numpy.array([h6(xi) for xi in x.T])
        result['cor_f'] = numpy.corrcoef((y, fx))[0][1]
        result['cor_g'] = numpy.corrcoef((y, gx))[0][1]
        result['cor_h'] = numpy.corrcoef((y, hx))[0][1]
        result['cor_h6'] = numpy.corrcoef((y, h6x))[0][1]
        result['gfi'] = gfi
        print(result)
        results.append(result)
    count = [0] * 10
    gfi_threshold = 0.7
    err = 1e-6
    writer = csv.writer(open('cor.csv', 'w'))
    keys = [
        'cor_f_sample',
        'cor_g_sample',
        'cor_h_sample',
        'cor_h6_sample',
        'cor_f',
        'cor_g',
        'cor_h',
        'cor_h6',
        'gfi',
    ]
    writer.writerow(keys)
    for r in results:
        cor_f = r['cor_f']
        cor_g = r['cor_g']
        cor_h = r['cor_h']
        gfi = r['gfi']
        if abs(gfi - 1) < err:
            count[9] += 1
        if abs(cor_f - cor_g) < err:
            if gfi > gfi_threshold:
                count[2] += 1
            else:
                count[3] += 1
        elif cor_f > cor_g:
            if gfi > gfi_threshold:
                count[0] += 1
            else:
                count[1] += 1
        else:
            if gfi > gfi_threshold:
                count[4] += 1
            else:
                count[5] += 1
        print(cor_f, cor_g, cor_h)
        writer.writerow([r[k] for k in keys])
    print('{:5d} {:5d}'.format(count[0], count[1]))
    print('{:5d} {:5d}'.format(count[2], count[3]))
    print('{:5d} {:5d}'.format(count[4], count[5]))
    print('{:5d}'.format(count[6]))


    #writer = csv.writer(open('data.csv', 'w'))
    #writer.writerow(xlabels)
    #for i in range(len(rows) - 1):
    #    writer.writerow([data[l][i] for l in xlabels])

if __name__ == '__main__':
    main()

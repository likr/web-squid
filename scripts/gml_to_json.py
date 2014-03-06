# coding: utf-8
from __future__ import print_function
import json
import xml.etree.ElementTree as ET


def main():
    result = []
    tree = ET.parse('data/coastl_jpn.gml')
    root = tree.getroot()
    for posList in root.findall('.//{http://www.opengis.net/gml/3.2}posList'):
        it = iter([float(x) for x in posList.text.split()])
        result.append(list(zip(it, it)))
    json.dump(result, open('public/data/coastl_jpn.json', 'w'))


if __name__ == '__main__':
    main()

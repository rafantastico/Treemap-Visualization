#!/usr/bin/env python
# Este archivo coding:  utf-8

"""
Script to generate a .dot file and its correspondent gif from a .mat file with the following fields:

M = number of variables

states (1xM) cell with the number of the state of each variable or the transitions beteween states of the variable
names (1xM) strings
weights (1xM) floats from 0 to 1

"""
import scipy.io
import sys
import os
import time
from optparse import OptionParser
import subprocess
import matplotlib.pyplot as plt


col_scale = plt.get_cmap('hot_r',14)

def addStateline(line,s,index_states,states_json,weight,weights_list):
    try:
        ind = index_states.index(s);
        if line not in states_json[ind]:
            states_temp = states_json[ind];
            states_temp.append(line)
            states_json[ind] = states_temp

            weights_list_temp = weights_list[ind]
            weights_list_temp.append(weight)
            weights_list[ind] = weights_list_temp
    except:
        index_states.append(s);
        states_json.append([line])
        weights_list.append([weight])

def getTranColor(ind):
    colorrgb=(int(hsv(ind)[0]*255),int(hsv(ind)[1]*255),int(hsv(ind)[2]*255))
    return "rgba({0},{1},{2},{3})".format(colorrgb[0],colorrgb[1],colorrgb[2],1)

def getColor(weights):
    #weight_mean = sum(weights)/len(weights)
    #ind = int(weight_mean*(len(color_list)-1))
    try:
        weight_max = max(weights)
    except:
        weight_max = weights
    ind = int(weight_max*(9))
    colorrgb=(int(col_scale(ind)[0]*255),int(col_scale(ind)[1]*255),int(col_scale(ind)[2]*255))
    return "rgba({0},{1},{2},{3})".format(colorrgb[0],colorrgb[1],colorrgb[2],1)

def getSize(weight):
    return int(weight*19000)+1000

parser = OptionParser(usage="usage: %prog [options]", version="%prog 0.1")
parser.add_option("-i", type='string', action="store", dest="iname", help="Name of the mat inputu file")
parser.add_option("-t", type='float', action="store", default=0, dest="threshold", help="Threshold for the weights of the variables to be ploted. 0 by default.")

(options, args) = parser.parse_args()

#----
#1--- LOAD .MAT FILE
#----
mat = scipy.io.loadmat(options.iname)

try:
    #states_array = mat['states'].T
    states_array = mat['states']
    names_array =  mat['names']
    weights_array =  mat['weights']
except:
    print "There is no states, names or weights array in .mat file"
    sys.exit()

size_s = states_array.shape
size_n = names_array.shape
size_w = weights_array.shape
if (size_s == size_n and size_w == size_n) == False:
	print "Wrong number of columns. All the arrays must have the exact same number of columns"
	sys.exit()
	
if size_s[0] != 1:
    print "Wrong number of rows in states array. It should be only one row."
    sys.exit()
else:
    M = size_s[1]

#----
#2--- ARRAYS TO LISTS OF PYTHON
#----
trans = 0
states = []
names = []
weights = []
for i in range(0,M):
    names.append(str(names_array[0][i])[3:-2])
    weights.append(float(weights_array[0][i]))
    state_i_col = states_array[0][i].shape[1]
    if state_i_col > 0:
        state_i = []
        state_i_col = states_array[0][i].shape[1]
        if state_i_col > 1:
            trans += 1
        for j in range(0,state_i_col):
            state_i.append(int(states_array[0][i][0][j]))
        states.append(state_i)
    elif state_i_col == 0:
        states.append([])
        pass
    else:
        print "Wrong number of rows in states_array"
        sys.exit()


NUMBER_HSV = trans +1
hsv = plt.get_cmap('Dark2',NUMBER_HSV)
#----
#3--- CREATE THE .json FILE FROM THE LISTS
#----
states_json = []
index_states = []
weights_list = []
transition = 1
for i,s in enumerate(states):
    if s != []:
        if weights[i] >= options.threshold:
            name = names[i]
            weight = weights[i]
            #size = getSize(weight)
            size = 1
            if len(s) == 1:
                line = '      {{"name": "{0}", "value": {1}, "color": "{2}"}},\n'.format(name,size,getColor(weight))
                addStateline(line,int(s[0]),index_states,states_json,weight,weights_list)
            else:
                for j in range(0,len(s)):
                    s_i = int(s[j])
                    line = '      {{"name": "{0}", "value": {1}, "transition": "{2}", "color": "{3}"}},\n'.format(name,size,getTranColor(transition),getColor(weight))
                    #State of s1
                    addStateline(line,s_i,index_states,states_json,weight,weights_list)
                    #state of s2
                    #addStateline(line,s2,index_states,states_json,weight,weights_list)
                transition += 1

lines = ['{\n "name": "MEDASTATES",\n "children": [\n']


for i,state_t in enumerate(states_json):
    RGBcolor = getColor(weights_list[i])
    lines.append('  {{\n   "name": "{0}",\n   "color": "{1}",\n   "children": [\n'.format(index_states[i],getColor(weights_list[i])))
    for j,l in enumerate(state_t):
        if j == len(state_t)-1:
            lines.append(l[:-2])
            lines.append('\n')
        else:
            lines.append(l)
    if i == len(states_json)-1:
        lines.append('     ]\n  }\n')
    else:
        lines.append('     ]\n  },\n')
lines.append(' ]\n}')
o = open(options.iname[:-4]+'.json','w')
o.writelines(lines)
o.close()

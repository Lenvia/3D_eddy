% ���ݼ��������2d�����ֲ�ͼ
close all;
clear all;
clc;

ensembleNo = 1;
metricThreshold = 100;
normThreshold = 1000;

dataFile = sprintf('circ%d.nc',ensembleNo);
surfaces = logical(zeros(500,500,60));

for timestep = 1:30
    bed = ncread(dataFile, 'circ', [1,1,timestep], [inf,inf,1]);
    bed = fliplr(single(bed));  % fliplr  ���ҷ�ת���� 
    bed = bed';
    clims = [0 3500];
    gcf = imagesc(bed, clims);
    colorbar
    saveas(gcf, sprintf('/Users/yy/Documents/MATLAB/circ%d/circ%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
%     surfaces(:,:,timestep) = logical(bed);
%     imwrite(bed,sprintf('/Users/yy/Documents/MATLAB/circ%d/circ%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
end
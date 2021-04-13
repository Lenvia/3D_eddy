% 根据检测结果生成2d涡旋分布图
close all;
clear all;
clc;

ensembleNo = 1;
metricThreshold = 100;
normThreshold = 1000;

dataFile = sprintf('3dAttr%d.nc',ensembleNo);
surfaces = logical(zeros(500,500,60));

for timestep = 1:5
    bed = ncread(dataFile, 'circ', [1,1,1,timestep], [inf,inf,1,1]);
    bed = fliplr(single(bed));  % fliplr  左右翻转矩阵 
    bed = bed';
	clims = [-2 2];
    gcf = imagesc(bed, clims);
    colorbar
    saveas(gcf, sprintf('/Users/yy/Documents/MATLAB/circ%d/circ%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
%     surfaces(:,:,timestep) = logical(bed);
%     imwrite(bed,sprintf('/Users/yy/Documents/MATLAB/circ%d/circ%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
end
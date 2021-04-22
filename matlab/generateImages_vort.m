% ���ݼ��������2d�����ֲ�ͼ
close all;
clear all;
clc;

ensembleNo = 1;
metricThreshold = 100;
normThreshold = 1000;

% dataFile = sprintf('3dAttr%d.nc',ensembleNo);
dataFile = '3dAttr2.nc';
surfaces = logical(zeros(500,500,60));

for timestep = 1:10
    bed = ncread(dataFile, 'vort', [1,1,1,timestep], [inf,inf,1,1]);
    bed = fliplr(single(bed));  % fliplr  ���ҷ�ת���� 
    bed = bed';
% 	clims = [-2 2];
    gcf = imagesc(bed);
    colorbar
    saveas(gcf, sprintf('/Users/yy/Documents/MATLAB/vort%d/vort%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
%     surfaces(:,:,timestep) = logical(bed);
%     imwrite(bed,sprintf('/Users/yy/Documents/MATLAB/vort%d/vort%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
end
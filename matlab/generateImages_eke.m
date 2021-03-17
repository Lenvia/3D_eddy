% 根据检测结果生成2d涡旋分布图
close all;
clear all;
clc;

ensembleNo = 1;
metricThreshold = 100;
normThreshold = 1000;

dataFile = sprintf('eke%d.nc',ensembleNo);
surfaces = logical(zeros(500,500,60));

for timestep = 1:30
    bed = ncread(dataFile, 'eke', [1,1,timestep], [inf,inf,1]);
    bed = fliplr(single(bed));  % fliplr  左右翻转矩阵 
    bed = bed';
    clims = [0 3500];
    gcf = imagesc(bed, clims);
    colorbar
    saveas(gcf, sprintf('/Users/yy/Documents/MATLAB/eke%d/eke%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
%     surfaces(:,:,timestep) = logical(bed);
%     imwrite(bed,sprintf('/Users/yy/Documents/MATLAB/circ%d/circ%dTimestep%d.png',ensembleNo,ensembleNo,timestep));
end

% ts1 = 2;
% ts2 = 3;
% 
% featurePoints1  = detectSURFFeatures(surfaces(:,:,ts1),'MetricThreshold',metricThreshold);
% featurePoints2 = detectSURFFeatures(surfaces(:,:,ts2),'MetricThreshold',metricThreshold);
% 
% [featuresIn   validPtsIn]  = extractFeatures(surfaces(:,:,ts1),  featurePoints1);
% [featuresOut validPtsOut]  = extractFeatures(surfaces(:,:,ts2), featurePoints2);
% 
% index_pairs = matchFeatures(featuresIn, featuresOut);
% 
% matchedPoints1 = validPtsIn(index_pairs(:,1));
% matchedPoints2 = validPtsOut(index_pairs(:,2));
% [m,~] = size(matchedPoints2.Location);
% for i = 1:m
%     if(norm(matchedPoints1.Location(i,:)-matchedPoints2.Location(i,:)) > normThreshold)
%         matchedPoints1.Location(i,1) = 0.1;
%         matchedPoints2.Location(i,1) = 0.1;
%         matchedPoints1.Location(i,2) = 0.1;
%         matchedPoints2.Location(i,2) = 0.1;
%     end
% end

% figure; ax = axes; 
% showMatchedFeatures(surfaces(:,:,ts1), surfaces(:,:,ts2), matchedPoints1,matchedPoints2,'montage','Parent',ax);
% legend(ax,'matchedPoints1','matchedPoints2');       

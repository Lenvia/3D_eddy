function [M] = nbrOperation(M,fil)
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here

% fil为滤波器, M为要滤波的数据,这里将fil放在M上,一个一个移动进行模板滤波. 
% 重叠区相*，然后相加
M = (filter2(fil,M) > 0);
end


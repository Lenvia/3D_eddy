function [M] = nbrOperation(M,fil)
%UNTITLED Summary of this function goes here
%   Detailed explanation goes here

% filΪ�˲���, MΪҪ�˲�������,���ｫfil����M��,һ��һ���ƶ�����ģ���˲�. 
% �ص�����*��Ȼ�����
M = (filter2(fil,M) > 0);
end


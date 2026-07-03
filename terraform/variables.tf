variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of an existing AWS EC2 key pair for SSH access"
  type        = string
  default     = "aws"
}

variable "app_port" {
  description = "Port the ShopEasy container is exposed on"
  type        = number
  default     = 80
}

variable "ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_cidr" {
  description = "CIDR block allowed to reach the app port"
  type        = string
  default     = "0.0.0.0/0"
}

variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "shopeasy"
}

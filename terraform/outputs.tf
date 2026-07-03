output "instance_id" {
  value = aws_instance.shopeasy.id
}

output "public_ip" {
  value = aws_instance.shopeasy.public_ip
}

output "public_dns" {
  value = aws_instance.shopeasy.public_dns
}

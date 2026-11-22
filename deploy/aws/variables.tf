variable "project" {
  type    = string
  default = "pirento"
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "domain" {
  description = "The site's domain, e.g. pirento.com. Its Route 53 hosted zone must already exist."
  type        = string
}

variable "image_tag" {
  description = "The tag of the one image every service runs (pushed to the ECR repo this makes)."
  type        = string
  default     = "latest"
}

variable "atlas_org_id" {
  description = "MongoDB Atlas organisation id."
  type        = string
}

variable "atlas_instance_size" {
  description = "Atlas tier. M40 to start; scale up (or shard) from the Atlas metrics, not by guess."
  type        = string
  default     = "M40"
}

variable "alert_email" {
  description = "Who gets alarms (5xx spikes, unhealthy services, database pressure)."
  type        = string
}

# How many copies of each service may run. Fargate adds copies when CPU passes 60% and removes them when it
# falls; these are the floors and ceilings. Two copies minimum, in different zones, so one can fail.
variable "services" {
  type = map(object({ port = number, cpu = number, memory = number, min = number, max = number }))
  default = {
    gateway  = { port = 4000, cpu = 1024, memory = 2048, min = 4, max = 200 }
    auth     = { port = 4001, cpu = 1024, memory = 2048, min = 3, max = 120 }
    wallet   = { port = 4002, cpu = 512, memory = 1024, min = 2, max = 60 }
    catalog  = { port = 4003, cpu = 512, memory = 1024, min = 2, max = 60 }
    orders   = { port = 4004, cpu = 1024, memory = 2048, min = 2, max = 80 }
    identity = { port = 4005, cpu = 1024, memory = 2048, min = 2, max = 80 }
    learning = { port = 4006, cpu = 1024, memory = 2048, min = 2, max = 80 }
    vault    = { port = 4007, cpu = 512, memory = 1024, min = 2, max = 40 }
    support  = { port = 4008, cpu = 512, memory = 1024, min = 2, max = 40 }
    ai       = { port = 4009, cpu = 512, memory = 1024, min = 2, max = 40 }
  }
}

# Settings that are not secret and not made here (Razorpay key ids, Digio template names, SMTP host …).
variable "plain_env" {
  type    = map(string)
  default = {}
}

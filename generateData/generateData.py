#!/bin/env python
import random, json, datetime as dt
from uuid import uuid4

random.seed()
nameData = []
with open('names.json','r') as names:
	nameData = json.load(names)

class EST(dt.tzinfo):
	def utcoffset(self, d):
		return dt.timedelta(hours=-5)
	def dst(self, d):
		return dt.timedelta(hours=1)


class Student(object):
	def __init__(self, average, deviation):

		self.firstName = random.choice(nameData['firstNames'])
		self.lastName = random.choice(nameData['lastNames'])
		self.name = '{} {}'.format(self.firstName, self.lastName)
		self.email = '{}.{}@myschool.edu'.format(self.firstName.lower(), self.lastName.lower())

		self.average = average
		self.deviation = deviation

	def answerQuestion(self, difficulty):
		return random.normalvariate(self.average,self.deviation) > difficulty



class Class(object):
	def __init__(self, numStudents, classAverage, classDeviation):
		self.students = []
		for i in range(numStudents):
			studentAverage = random.normalvariate(classAverage, classDeviation)
			studentDeviation = 15
			self.students.append( Student( studentAverage, studentDeviation ) )

	def takeTest(self, test):
		results = TestResults(len(test))
		for questionNum,difficulty in enumerate(test):
			for student in self.students:
				results.logAnswer( student, questionNum, student.answerQuestion(difficulty) )

		return results


class Test(list):
	def __init__(self, name, questions):
		self.name = name
		for q in questions:
			self.append(q)


class Battery(object):
	def __init__(self):
		self.tests = []

	def run(self, group):
		result = {}
		for test in self.tests:
			result[test.name] = group.takeTest(test)

		return result


class TestResults(list):
	def __init__(self, numQuestions):
		for i in range(numQuestions):
			self.append({})

	def logAnswer(self, student, questionNumber, success):
		self[questionNumber][student] = success


def genStatements(results):

	xapiStatements = []

	for testid,questions in results.items():

		times = {}
		averages = {}
		try:
			startTime += dt.timedelta(hours=3)
		except UnboundLocalError:
			startTime = dt.datetime.now(EST())

		for qNum,qResults in enumerate(questions):

			for student,result in qResults.items():

				if qNum == 0:
					xapiStatements.append( genStatement(student,'attempted',testid,startTime) )

				activity = '{}/q{}'.format(testid,qNum)
				times[student] = times.get(student, startTime) + dt.timedelta(seconds=random.randint(30,90))

				xapiStatements.append( genStatement(student,'answered',activity,times[student],result) )

				averages[student] = (averages.get(student, 0) * qNum + (100 if result else 0))/(qNum+1)

		for student,time in times.items():
			xapiStatements.append( genStatement(student,'completed',testid,time) )
			passed = 'passed' if averages[student] > 60 else 'failed'
			xapiStatements.append( genStatement(student,passed,testid,time,averages[student]) )

	return xapiStatements

			
def genStatement(student, verb, activity, time, score=None):
	stmt = {
		'actor': {
			'name': student.name,
			'mbox': 'mailto:'+student.email
		},
		'verb': {
			'id': 'http://adlnet.gov/expapi/verbs/'+verb,
			'display': {'en-US': verb}
		},
		'object': {
			'id': 'http://myschool.edu/xapi_vocab/'+activity,
			'definition': {
				'name': activity
			}
		},

		'authority': {
			'mbox': 'mailto:admin@myschool.edu',
			'objectType': 'Agent'
		},
		'timestamp': time.isoformat(),
		'stored': time.isoformat(),
		'version': '1.0.1',
		'id': str(uuid4())
	}

	if isinstance(score, bool):
		stmt['result'] = {
			'success': score
		}
	elif isinstance(score, int):
		stmt['result'] = {
			'score': {
				'raw': score,
				'min': 0,
				'max': 100
			}
		}
	
	return stmt



def main():

	battery = Battery()
	battery.tests.append( Test('test1', [25,25,25,50,50,50]) )

	myclass = Class(10, 80, 20)

	results = battery.run(myclass)
	statements = genStatements(results)
	print json.dumps(statements, indent=4)

if __name__ == '__main__':
	main()
